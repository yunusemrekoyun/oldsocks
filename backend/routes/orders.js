// backend/routes/orders.js
const router = require("express").Router();
const { verifyToken } = require("../middleware/auth");
const orderCtrl = require("../controllers/orderController");
const { allowRoles } = require("../middleware/roles");
// Admin hepsi görsün:
router.get("/all", verifyToken, allowRoles("admin"), orderCtrl.getAllOrders);

// Admin sipariş statüsü güncellemesi:
router.put(
  "/:id/status",
  verifyToken,
  allowRoles("admin"),
  orderCtrl.updateOrderStatus
);
// Tüm endpoint’ler korumalı
router.use(verifyToken);

router.get("/", orderCtrl.getMyOrders); // GET /api/v1/orders
router.get("/:id", orderCtrl.getOrderById); // GET /api/v1/orders/:id

// Ödeme callback’ini değiştirmeden, frontend’ten çağracağız:
router.post("/confirm", orderCtrl.confirmOrderPayment); // POST /api/v1/orders/confirm

module.exports = router;
