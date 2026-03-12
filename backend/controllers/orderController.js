// backend/controllers/orderController.js
const Order = require("../models/Order");
const { applyStockChanges } = require("../utils/updateStock");
const { dispatchOrderPlacedMail } = require("../utils/orderMailDispatch");

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
      status: "paid",
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

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Sipariş bulunamadı." });
    }

    // status değiştir
    order.status = status;
    if (status === "paid") {
      order.adminSeenAt = null;

      try {
        await applyStockChanges(order);
        console.log("[OrderController] Admin manuel paid → stok güncellendi.");
      } catch (e) {
        console.error("[OrderController] Stok düşürme hatası:", e);
      }

      if (!order.customerMailSentAt || !order.adminMailSentAt) {
        try {
          await dispatchOrderPlacedMail(order);
        } catch (e) {
          console.error("[OrderController] Mail gönderilemedi:", e);
        }
      }
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
    status: { $in: ["paid", "shipped", "completed"] },
  }).sort("-createdAt");

  res.json(orders);
};

exports.getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Sipariş bulunamadı." });
  res.json(order);
};

exports.confirmOrderPayment = async (req, res) => {
  const { conversationId } = req.body;
  if (!conversationId)
    return res.status(400).json({ message: "Eksik parametre." });

  const order = await Order.findOne({ conversationId });
  if (!order) return res.status(404).json({ message: "Sipariş bulunamadı." });

  if (order.status !== "paid") {
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
