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
router.get(
  "/unseen-count",
  verifyToken,
  allowRoles("admin"),
  orderCtrl.getUnseenPaidCount
);
router.put(
  "/mark-seen",
  verifyToken,
  allowRoles("admin"),
  orderCtrl.markPaidOrdersSeen
);
// Tüm endpoint’ler korumalı

router.post("/confirm", orderCtrl.confirmOrderPayment);

// Tüm kalan endpoint’ler korumalı
router.use(verifyToken);
router.get("/", orderCtrl.getMyOrders);
router.get("/:id", orderCtrl.getOrderById);

module.exports = router;
