// backend/controllers/orderController.js
const Order = require("../models/Order");
const User = require("../models/User");
const {
  finalizeOrderPayment,
  StockUnavailableError,
  OrderPaymentStateError,
} = require("../utils/updateStock");
const { queueOrderMails } = require("../services/orderMailQueue");
const { recordCouponUsageForOrder } = require("../utils/couponUsageService");

async function persistCouponUsage(order) {
  try {
    await recordCouponUsageForOrder(order);
  } catch (err) {
    if (err?.code === 11000) return;
    console.warn("[OrderController] Kupon kullanımı kaydedilemedi:", err?.message || err);
  }
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const ORDER_STATUSES = ["pending", "payment_review", "paid", "shipped", "completed", "cancelled"];

// Admin listesi: ?page verilirse sunucu tarafında sayfalanır, filtrelenir ve aranır.
// Parametresiz çağrı eski davranışı (tüm siparişler, dizi) korur.
async function getOrdersPage(req, res) {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const pageSize = Math.min(100, Math.max(5, Number.parseInt(req.query.pageSize, 10) || 20));
  const mode = req.query.mode === "pending" ? "pending" : "active";
  const status = ORDER_STATUSES.includes(req.query.status) ? req.query.status : "";
  const sort = req.query.sort === "asc" ? { createdAt: 1 } : { createdAt: -1 };
  const q = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 80) : "";

  const filter = mode === "pending" ? { status: "pending" } : { status: { $ne: "pending" } };
  if (status && mode === "active" && status !== "pending") filter.status = status;
  if (q) {
    const pattern = new RegExp(escapeRegex(q), "i");
    const digits = q.replace(/\D/g, "");
    const users = await User.find({
      $or: [{ email: pattern }, { firstName: pattern }, { lastName: pattern }, ...(digits.length >= 4 ? [{ phone: new RegExp(escapeRegex(digits)) }] : [])],
    })
      .select("_id")
      .limit(200)
      .lean();
    filter.$or = [
      { orderNumber: pattern },
      { "guest.email": pattern },
      { "guest.firstName": pattern },
      { "guest.lastName": pattern },
      ...(digits.length >= 4 ? [{ "guest.phone": new RegExp(escapeRegex(digits)) }] : []),
      ...(users.length ? [{ user: { $in: users.map((u) => u._id) } }] : []),
    ];
  }

  const [items, total, pendingCount, activeCount] = await Promise.all([
    Order.find(filter)
      .sort(sort)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate("user", "firstName lastName email")
      .populate("items.productId", "images name"),
    Order.countDocuments(filter),
    Order.countDocuments({ status: "pending" }),
    Order.countDocuments({ status: { $ne: "pending" } }),
  ]);
  res.json({ items, total, page, pageSize, pendingCount, activeCount });
}

exports.getAllOrders = async (req, res) => {
  try {
    if (req.query.page !== undefined) return await getOrdersPage(req, res);
    const orders = await Order.find()
      .sort("-createdAt")
      .populate("user", "firstName lastName email")
      .populate("items.productId", "images name");
    res.json(orders);
  } catch (err) {
    console.error("getAllOrders error:", err);
    res.status(500).json({ message: "Siparişler alınırken hata oluştu." });
  }
};

exports.getUnseenPaidCount = async (req, res) => {
  try {
    const count = await Order.countDocuments({
      status: { $in: ["paid", "payment_review"] },
      adminSeenAt: null,
    });
    res.json({ count });
  } catch (err) {
    console.error("getUnseenPaidCount error:", err);
    res.status(500).json({ message: "Görülmemiş sipariş sayısı alınamadı." });
  }
};

exports.markPaidOrdersSeen = async (req, res) => {
  try {
    const now = new Date();
    const result = await Order.updateMany(
      { status: { $in: ["paid", "payment_review"] }, adminSeenAt: null },
      { $set: { adminSeenAt: now } }
    );

    const matched = result.matchedCount ?? result.n ?? 0;
    const modified = result.modifiedCount ?? result.nModified ?? 0;
    res.json({ matched, modified, seenAt: now });
  } catch (err) {
    console.error("markPaidOrdersSeen error:", err);
    res.status(500).json({ message: "Siparişler görüldü işaretlenemedi." });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = [
      "pending",
      "payment_review",
      "paid",
      "shipped",
      "completed",
      "cancelled",
    ];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Geçersiz status değeri." });
    }

    let order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Sipariş bulunamadı." });
    }

    if (status === "payment_review" && order.status !== "payment_review") {
      return res.status(409).json({
        message:
          "Ödeme inceleme durumu yalnızca ödeme sistemi tarafından atanabilir.",
      });
    }
    if (order.status === "payment_review" && status === "pending") {
      return res.status(409).json({
        message:
          "Ödemesi alınmış inceleme kaydı tekrar bekleyen siparişe çevrilemez.",
      });
    }

    if (
      order.stockUpdated &&
      ["pending", "cancelled"].includes(status)
    ) {
      return res.status(409).json({
        message:
          "Stoğu düşülmüş bir sipariş doğrudan bekleyen veya iptal durumuna alınamaz.",
      });
    }
    if (
      ["shipped", "completed"].includes(status) &&
      !order.stockUpdated
    ) {
      return res.status(409).json({
        message: "Ödemesi ve stok işlemi tamamlanmamış sipariş gönderilemez.",
      });
    }

    if (status === "paid") {
      try {
        order = await finalizeOrderPayment(order._id);
        console.log("[OrderController] Admin manuel paid → stok güncellendi.");
      } catch (error) {
        if (
          error instanceof StockUnavailableError ||
          error instanceof OrderPaymentStateError
        ) {
          return res.status(409).json({
            message:
              "Sipariş mevcut durumu veya stok yetersizliği nedeniyle ödenmiş durumuna alınamadı.",
          });
        }
        throw error;
      }

      await persistCouponUsage(order);
    } else {
      order.status = status;
    }

    await order.save();
    if (status === "paid") queueOrderMails(order._id);
    res.json({ message: "Sipariş durumu güncellendi.", order });
  } catch (err) {
    console.error("updateOrderStatus error:", err);
    res
      .status(500)
      .json({ message: "Sipariş durumu güncellenirken hata oluştu." });
  }
};

exports.getMyOrders = async (req, res) => {
  const userId = req.user.userId;
  const orders = await Order.find({
    user: userId,
    status: { $in: ["payment_review", "paid", "shipped", "completed"] },
  }).sort("-createdAt");

  res.json(orders);
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "firstName lastName email phone")
      .populate("items.productId", "images name");
    if (!order) return res.status(404).json({ message: "Sipariş bulunamadı." });

    const isAdmin = req.user?.role === "admin";
    const ownerId =
      order.user && typeof order.user === "object"
        ? order.user._id
        : order.user;
    const isOwner =
      ownerId && String(ownerId) === String(req.user?.userId || "");

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: "Bu siparişe erişim yetkiniz yok." });
    }

    res.json(order);
  } catch (err) {
    console.error("getOrderById error:", err);
    res.status(500).json({ message: "Sipariş alınırken hata oluştu." });
  }
};

exports.confirmOrderPayment = async (req, res) => {
  // Sorgu operatörü taşıyan nesneler başka siparişi eşleyebilir; yalnız metin kabul edilir.
  const conversationId =
    typeof req.body?.conversationId === "string" ? req.body.conversationId.trim() : "";
  if (!conversationId || conversationId.length > 64)
    return res.status(400).json({ message: "Eksik parametre." });

  const order = await Order.findOne({ conversationId });
  if (!order) return res.status(404).json({ message: "Sipariş bulunamadı." });

  if (order.status !== "paid") {
    if (order.status === "payment_review") {
      return res.status(409).json({
        code: "PAYMENT_REVIEW",
        orderNumber: order.orderNumber,
        message:
          "Ödemeniz alındı; siparişiniz stok veya tutar kontrolü için incelemeye alındı. Ekibimiz sizinle iletişime geçecek.",
      });
    }
    return res.status(409).json({ message: "Ödeme henüz onaylanmadı." });
  }

  // Bildirim yolu henüz göndermediyse (ör. yarıda kaldıysa) arka planda dene;
  // sahiplik işareti çift e-postayı önler.
  if (!order.orderMailSentAt) queueOrderMails(order._id);

  return res.json({ orderNumber: order.orderNumber });
};
