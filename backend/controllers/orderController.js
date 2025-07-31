// backend/controllers/orderController.js
const Order = require("../models/Order");
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .sort("-createdAt")
      .populate("user", "firstName lastName email"); // istersen user bilgisini de getirebilirsin
    res.json(orders);
  } catch (err) {
    console.error("getAllOrders error:", err);
    res.status(500).json({ message: "Siparişler alınırken hata oluştu." });
  }
};

// — Admin: Siparişin durumunu günceller —
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["pending", "paid", "shipped", "completed", "cancelled"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Geçersiz status değeri." });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
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
// — Kullanıcının kendi siparişlerini listeler
exports.getMyOrders = async (req, res) => {
  const userId = req.user.userId;
  const orders = await Order.find({
    user: userId,
    status: { $in: ["paid", "shipped", "completed"] },
  }).sort("-createdAt");

  res.json(orders);
};

// — Tek bir siparişi gösterir
exports.getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Sipariş bulunamadı." });
  res.json(order);
};

// — Ödeme sonrası frontend’den çağrılacak: status=paid, paymentId varsa güncelle
exports.confirmOrderPayment = async (req, res) => {
  const { conversationId, paymentId } = req.body;
  if (!conversationId || !paymentId) {
    return res.status(400).json({ message: "Eksik parametre." });
  }

  const order = await Order.findOneAndUpdate(
    { conversationId },
    { paymentId, status: "paid" },
    { new: true }
  );

  if (!order) {
    return res.status(404).json({ message: "Sipariş bulunamadı." });
  }

  // artık sadece sipariş numarasını dönüyoruz
  res.json({ orderNumber: order.orderNumber });
};
