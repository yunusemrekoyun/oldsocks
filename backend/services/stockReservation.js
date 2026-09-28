// Stok rezervasyonu: müşteri ödeme ekranına geçtiğinde (sepette değil) sipariş
// oluşturulurken stok aynı işlemde düşülür ve belirli süre bu siparişe ayrılır.
// Ödeme başarısız olursa, süre dolarsa veya müşteri yeni bir ödeme başlatırsa stok
// geri eklenir. Ödeme başarılı olursa stok tekrar düşülmez.
const Order = require("../models/Order");
const { applyStockChanges, restoreStock } = require("../utils/updateStock");
const { invalidateCatalog } = require("./catalogCache");

const HOLD_MINUTES = Math.max(5, Number(process.env.STOCK_HOLD_MINUTES) || 20);
const HOLD_MS = HOLD_MINUTES * 60 * 1000;
// PayTR ödeme sayfası rezervasyondan önce kapansın; aradaki süre geç gelen bildirim içindir.
const PAYTR_TIMEOUT_MINUTES = Math.max(5, HOLD_MINUTES - 5);

async function inTransaction(work) {
  const session = await Order.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}

// Stok yetmezse StockUnavailableError fırlatır; sipariş oluşmaz.
async function createOrderWithReservation(orderData) {
  const created = await inTransaction(async (session) => {
    await applyStockChanges({ items: orderData.items }, { session });
    const [order] = await Order.create(
      [{ ...orderData, stockUpdated: true, stockReservedUntil: new Date(Date.now() + HOLD_MS) }],
      { session }
    );
    return order;
  });
  invalidateCatalog();
  return created;
}

// Bekleyen siparişi kapatır; ayrılmış stok varsa geri ekler. Sipariş artık bekleyen
// değilse (ör. ödendi) hiçbir şey yapmaz.
async function releaseReservation(orderId, reason) {
  const restored = await inTransaction(async (session) => {
    const order = await Order.findById(orderId).session(session);
    if (!order || order.status !== "pending") return false;
    let didRestore = false;
    if (order.stockUpdated) {
      await restoreStock(order, { session });
      order.stockUpdated = false;
      didRestore = true;
    }
    order.status = "cancelled";
    order.cancelReason = reason;
    order.cancelledAt = new Date();
    order.stockReservedUntil = null;
    await order.save({ session });
    return didRestore;
  });
  if (restored) invalidateCatalog();
  return restored;
}

// Aynı müşterinin (üye kimliği veya e-posta) önceki bekleyen ödeme oturumlarını kapatır;
// müşteri yeniden denediğinde kendi ayırdığı son adet ona engel olmasın.
async function releaseCustomerPendingOrders({ userId, email }) {
  const identity = [
    ...(userId ? [{ user: userId }] : []),
    ...(email ? [{ "guest.email": String(email).trim().toLowerCase() }] : []),
  ];
  if (!identity.length) return 0;
  const pending = await Order.find({ status: "pending", $or: identity }).select("_id").lean();
  for (const { _id } of pending) await releaseReservation(_id, "session_replaced");
  return pending.length;
}

async function releaseExpiredReservations(limit = 50) {
  const expired = await Order.find({
    status: "pending",
    stockUpdated: true,
    stockReservedUntil: { $ne: null, $lt: new Date() },
  })
    .select("_id")
    .limit(limit)
    .lean();
  for (const { _id } of expired) await releaseReservation(_id, "reservation_expired");
  if (expired.length) console.log(`[stock] süresi dolan ${expired.length} ödeme oturumunun stoğu geri verildi.`);
  return expired.length;
}

module.exports = {
  HOLD_MINUTES,
  PAYTR_TIMEOUT_MINUTES,
  createOrderWithReservation,
  releaseReservation,
  releaseCustomerPendingOrders,
  releaseExpiredReservations,
};
