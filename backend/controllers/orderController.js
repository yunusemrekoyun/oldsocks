// backend/controllers/orderController.js
const Order = require("../models/Order");

// — Kullanıcının kendi siparişlerini listeler
exports.getMyOrders = async (req, res) => {
  const userId = req.user.userId;
  const orders = await Order.find({ user: userId }).sort("-createdAt");
  res.json(orders);
};

// — Tek bir siparişi gösterir
exports.getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Sipariş bulunamadı." });
  // isteğe bağlı: başka kullanıcı siparişi ise 403
  res.json(order);
};

// — Ödeme sonrası frontend’den çağrılacak: status=paid, paymentId varsa güncelle
exports.confirmOrderPayment = async (req, res) => {
  const { conversationId, paymentId } = req.body;
  if (!conversationId || !paymentId)
    return res.status(400).json({ message: "Eksik parametre." });

  const order = await Order.findOneAndUpdate(
    { conversationId },
    { paymentId, status: "paid" },
    { new: true }
  );
  if (!order) return res.status(404).json({ message: "Sipariş bulunamadı." });
  res.json(order);
};
