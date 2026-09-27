// Sipariş e-postaları istek yolunun dışında gönderilir: PayTR bildirimi e-posta
// sunucusunu beklemeden "OK" alır. Siparişteki *MailSentAt alanları kalıcı kuyruk
// görevi görür; gönderilemeyenleri tarayıcı (sweeper) yeniden dener.
// mailAttemptAt ile aynı sipariş için eşzamanlı iki gönderim (bildirim + sonuç
// sayfası) engellenir.
const Order = require("../models/Order");
const { dispatchOrderPlacedMail } = require("../utils/orderMailDispatch");
const { sendAdminAlertMail, sendOrderStatusMail } = require("../utils/mailer");

const PAID_STATUSES = ["paid", "shipped", "completed"];
const CLAIM_TTL_MS = 5 * 60 * 1000;
const SWEEP_MS = Number(process.env.ORDER_MAIL_SWEEP_MS || 60 * 1000);
const SWEEP_GRACE_MS = Number(process.env.ORDER_MAIL_SWEEP_GRACE_MS || 60 * 1000);

async function claim(orderId) {
  const now = new Date();
  return Order.findOneAndUpdate(
    {
      _id: orderId,
      status: { $in: PAID_STATUSES },
      orderMailSentAt: null,
      $or: [{ mailAttemptAt: null }, { mailAttemptAt: { $lt: new Date(now.getTime() - CLAIM_TTL_MS) } }],
    },
    { $set: { mailAttemptAt: now } },
    { new: true }
  );
}

async function sendOrderMails(orderId) {
  const order = await claim(orderId);
  if (!order) return false;
  try {
    await dispatchOrderPlacedMail(order);
  } catch (error) {
    console.warn("[order-mail] gönderilemedi:", error?.message || error);
  }
  // Yalnız e-posta alanları yazılır; siparişin diğer alanlarını ezmez.
  await Order.updateOne(
    { _id: order._id },
    {
      $set: {
        customerMailSentAt: order.customerMailSentAt || null,
        adminMailSentAt: order.adminMailSentAt || null,
        orderMailSentAt: order.orderMailSentAt || null,
        mailAttemptAt: order.orderMailSentAt ? order.mailAttemptAt : null,
      },
    }
  );
  return Boolean(order.orderMailSentAt);
}

function queueOrderMails(orderId) {
  setImmediate(() => {
    sendOrderMails(orderId).catch((error) =>
      console.error("[order-mail] kuyruk hatası:", error?.message || error)
    );
  });
}

// Ödeme alınıp sipariş incelemeye düştüğünde yöneticiye bir kez haber ver.
async function alertPaymentReview(orderId) {
  const order = await Order.findOneAndUpdate(
    { _id: orderId, status: "payment_review", reviewAlertSentAt: null },
    { $set: { reviewAlertSentAt: new Date() } },
    { new: true }
  );
  if (!order) return;
  const reasons = {
    amount_mismatch_after_payment: "PayTR'den gelen tutar sipariş tutarından düşük.",
    stock_unavailable_after_payment: "Ödeme alındı ama ürün stokta kalmadı.",
    paid_after_cancel: "İptal edilmiş bir siparişe ödeme geldi.",
  };
  try {
    await sendAdminAlertMail({
      subject: `Sipariş #${order.orderNumber} incelemede: ödeme alındı`,
      lines: [
        reasons[order.cancelReason] || "Ödeme alındı ama sipariş otomatik tamamlanamadı.",
        `Tutar: ${Number(order.totalPrice || 0).toFixed(2)} TL`,
        "PayTR panelinden ödemeyi kontrol edip siparişi tamamlayın ya da iade edin.",
      ],
    });
  } catch (error) {
    await Order.updateOne({ _id: order._id }, { $set: { reviewAlertSentAt: null } });
    throw error;
  }
}

function queuePaymentReviewAlert(orderId) {
  setImmediate(() => {
    alertPaymentReview(orderId).catch((error) =>
      console.error("[order-mail] inceleme uyarısı gönderilemedi:", error?.message || error)
    );
  });
}

// Kargo ve teslim e-postaları. Durum hâlâ aynıysa ve e-posta gitmediyse gönderilir;
// yönetici durumu geri aldıysa gönderilmez.
const STATUS_MAIL_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const STATUS_MAIL = {
  shipped: { status: "shipped", at: "shippedAt", sent: "shippedMailSentAt" },
  delivered: { status: "completed", at: "deliveredAt", sent: "deliveredMailSentAt" },
  // Yalnız yöneticinin "müşteriye bildir" dediği iptaller; terk edilen ödeme
  // oturumlarının kapatılması e-posta göndermez.
  cancelled: {
    status: "cancelled",
    at: "cancelledAt",
    sent: "cancelledMailSentAt",
    filter: { "refund.notifyCustomer": true },
  },
};

async function sendStatusMail(orderId, kind) {
  const spec = STATUS_MAIL[kind];
  const now = new Date();
  const order = await Order.findOneAndUpdate(
    {
      _id: orderId,
      status: spec.status,
      [spec.at]: { $ne: null },
      [spec.sent]: null,
      ...spec.filter,
      $or: [{ statusMailAttemptAt: null }, { statusMailAttemptAt: { $lt: new Date(now.getTime() - CLAIM_TTL_MS) } }],
    },
    { $set: { statusMailAttemptAt: now } },
    { new: true }
  );
  if (!order) return false;
  let sent = false;
  try {
    await sendOrderStatusMail(order, kind);
    sent = true;
  } catch (error) {
    console.warn(`[order-mail] ${kind} e-postası gönderilemedi:`, error?.message || error);
  }
  await Order.updateOne(
    { _id: order._id },
    { $set: { statusMailAttemptAt: null, ...(sent ? { [spec.sent]: new Date() } : {}) } }
  );
  return sent;
}

function queueStatusMail(orderId, kind) {
  setImmediate(() => {
    sendStatusMail(orderId, kind).catch((error) =>
      console.error("[order-mail] durum e-postası kuyruk hatası:", error?.message || error)
    );
  });
}

// 24 saati geçen ödenmemiş siparişler terk edilmiş sayılır ve kapatılır. Sonradan
// ödeme gelirse PayTR bildirimi siparişi incelemeye alır, yönetici uyarılır.
const ABANDON_AFTER_MS = 24 * 60 * 60 * 1000;
async function closeAbandonedOrders() {
  const result = await Order.updateMany(
    { status: "pending", createdAt: { $lt: new Date(Date.now() - ABANDON_AFTER_MS) } },
    { $set: { status: "cancelled", cancelReason: "payment_abandoned", cancelledAt: new Date() } }
  );
  if (result.modifiedCount) console.log(`[orders] ${result.modifiedCount} terk edilmiş sipariş kapatıldı.`);
}

async function sweep() {
  await closeAbandonedOrders();
  const cutoff = new Date(Date.now() - SWEEP_GRACE_MS);
  const pending = await Order.find({
    status: { $in: PAID_STATUSES },
    orderMailSentAt: null,
    paymentReceivedAt: { $ne: null, $lt: cutoff },
    $or: [{ mailAttemptAt: null }, { mailAttemptAt: { $lt: new Date(Date.now() - CLAIM_TTL_MS) } }],
  })
    .select("_id")
    .limit(20)
    .lean();
  for (const { _id } of pending) await sendOrderMails(_id);

  const reviews = await Order.find({ status: "payment_review", reviewAlertSentAt: null })
    .select("_id")
    .limit(20)
    .lean();
  for (const { _id } of reviews) await alertPaymentReview(_id).catch(() => {});

  for (const [kind, spec] of Object.entries(STATUS_MAIL)) {
    const due = await Order.find({
      status: spec.status,
      // Bir haftadan eski olanlar için tekrar denenmez.
      [spec.at]: { $gte: new Date(Date.now() - STATUS_MAIL_MAX_AGE_MS), $lt: cutoff },
      [spec.sent]: null,
      ...spec.filter,
      $or: [{ statusMailAttemptAt: null }, { statusMailAttemptAt: { $lt: new Date(Date.now() - CLAIM_TTL_MS) } }],
    })
      .select("_id")
      .limit(20)
      .lean();
    for (const { _id } of due) await sendStatusMail(_id, kind);
  }
}

function startOrderMailSweeper() {
  let stopped = false;
  let timer;
  const tick = async () => {
    if (stopped) return;
    try {
      await sweep();
    } catch (error) {
      console.error("[order-mail] tarama hatası:", error?.message || error);
    } finally {
      if (!stopped) timer = setTimeout(tick, SWEEP_MS);
    }
  };
  timer = setTimeout(tick, SWEEP_MS);
  return { stop() { stopped = true; clearTimeout(timer); } };
}

module.exports = {
  queueOrderMails,
  queuePaymentReviewAlert,
  queueStatusMail,
  sendOrderMails,
  sendStatusMail,
  startOrderMailSweeper,
};
