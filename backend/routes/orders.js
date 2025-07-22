// backend/routes/orders.js
const router = require("express").Router();
const { verifyToken } = require("../middleware/auth");
const orderCtrl = require("../controllers/orderController");

// Tüm endpoint’ler korumalı
router.use(verifyToken);

router.get("/", orderCtrl.getMyOrders); // GET /api/v1/orders
router.get("/:id", orderCtrl.getOrderById); // GET /api/v1/orders/:id

// Ödeme callback’ini değiştirmeden, frontend’ten çağracağız:
router.post("/confirm", orderCtrl.confirmOrderPayment); // POST /api/v1/orders/confirm

module.exports = router;
