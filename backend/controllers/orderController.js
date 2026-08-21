// backend/controllers/orderController.js
const Order = require("../models/Order");
const {
  finalizeOrderPayment,
  StockUnavailableError,
  OrderPaymentStateError,
} = require("../utils/updateStock");
const { dispatchOrderPlacedMail } = require("../utils/orderMailDispatch");
const { recordCouponUsageForOrder } = require("../utils/couponUsageService");

async function persistCouponUsage(order) {
  try {
    await recordCouponUsageForOrder(order);
  } catch (err) {
    if (err?.code === 11000) return;
    console.warn("[OrderController] Kupon kullanımı kaydedilemedi:", err?.message || err);
  }
}

exports.getAllOrders = async (req, res) => {
  try {
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

      if (!order.customerMailSentAt || !order.adminMailSentAt) {
        try {
          await dispatchOrderPlacedMail(order);
        } catch (e) {
          console.error("[OrderController] Mail gönderilemedi:", e);
        }
      }
    } else {
      order.status = status;
    }

    await order.save();
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
  const { conversationId } = req.body;
  if (!conversationId)
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

  if (!order.customerMailSentAt || !order.adminMailSentAt) {
    try {
      await dispatchOrderPlacedMail(order);
      await order.save();
      console.log("[OrderConfirm] Mail gönderildi (safety).");
    } catch (e) {
      console.error("[OrderConfirm] Mail gönderilemedi:", e?.message || e);
      // Burada hata olsa bile sipariş numarasını döndürmeye devam ediyoruz
    }
  }

  return res.json({ orderNumber: order.orderNumber });
};
