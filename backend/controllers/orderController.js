// backend/controllers/orderController.js
const Order = require("../models/Order");
const { applyStockChanges } = require("../utils/updateStock");

// ✅ EKLE: mail helper
const { sendOrderPlacedMail } = require("../utils/mailer");

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .sort("-createdAt")
      .populate("user", "firstName lastName email");
    res.json(orders);
  } catch (err) {
    console.error("getAllOrders error:", err);
    res.status(500).json({ message: "Siparişler alınırken hata oluştu." });
  }
};
/** ────────────────────────────────────────────────────────────────
+ *  GET /orders/unseen-count  (admin)
+ *  status=paid & adminSeenAt=null olan kayıt sayısı
+ *  ───────────────────────────────────────────────────────────────*/
exports.getUnseenPaidCount = async (req, res) => {
  try {
    const count = await Order.countDocuments({
      status: "paid",
      adminSeenAt: null,
    });
    res.json({ count });
  } catch (err) {
    console.error("getUnseenPaidCount error:", err);
    res.status(500).json({ message: "Görülmemiş sipariş sayısı alınamadı." });
  }
};

/** ────────────────────────────────────────────────────────────────
+ *  PUT /orders/mark-seen  (admin)
+ *  status=paid & adminSeenAt=null tüm siparişleri görüldü işaretle
+ *  ───────────────────────────────────────────────────────────────*/
exports.markPaidOrdersSeen = async (req, res) => {
  try {
    const now = new Date();
    const result = await Order.updateMany(
      { status: "paid", adminSeenAt: null },
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
    const allowed = ["pending", "paid", "shipped", "completed", "cancelled"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Geçersiz status değeri." });
    }

    const update =
      status === "paid" ? { status, adminSeenAt: null } : { status };
    const order = await Order.findByIdAndUpdate(req.params.id, update, {
      new: true,
    });
    if (!order) {
      return res.status(404).json({ message: "Sipariş bulunamadı." });
    }

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
    status: { $in: ["paid", "shipped", "completed"] },
  }).sort("-createdAt");

  res.json(orders);
};

exports.getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Sipariş bulunamadı." });
  res.json(order);
};

// — Ödeme sonrası: status=paid, paymentId varsa güncelle
exports.confirmOrderPayment = async (req, res) => {
  const { conversationId, paymentId } = req.body;
  if (!conversationId || !paymentId) {
    return res.status(400).json({ message: "Eksik parametre." });
  }

  // Bu query sadece İLK kez düşer (stockUpdated:false koşulu nedeniyle)
  const order = await Order.findOneAndUpdate(
    { conversationId, stockUpdated: false },
    { paymentId, status: "paid", stockUpdated: true, adminSeenAt: null },
    { new: true }
  );

  if (order) {
    await applyStockChanges(order);

    // ✅ BURADA admin’e mail gönder: yalnızca ilk kez paid olduğunda tetiklenir
    sendOrderPlacedMail(order).catch((err) => {
      console.error("Sipariş maili gönderilemedi:", err);
      // not: mail hatası sipariş akışını bozmaz
    });

    return res.json({ orderNumber: order.orderNumber });
  }

  // İkinci/tekrar çağrılarda buraya düşer (mail tekrar gönderilmez)
  const existing = await Order.findOne({ conversationId }).select(
    "orderNumber"
  );
  if (!existing) {
    return res.status(404).json({ message: "Sipariş bulunamadı." });
  }
  res.json({ orderNumber: existing.orderNumber });
};
