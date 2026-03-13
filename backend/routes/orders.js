// backend/routes/orders.js
const router = require("express").Router();
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const { verifyToken } = require("../middleware/auth");
const orderCtrl = require("../controllers/orderController");
const { allowRoles } = require("../middleware/roles");

const confirmLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip),
});
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

router.post("/confirm", confirmLimiter, orderCtrl.confirmOrderPayment);

// Tüm kalan endpoint’ler korumalı
router.use(verifyToken);
router.get("/", orderCtrl.getMyOrders);
router.get("/:id", orderCtrl.getOrderById);

module.exports = router;
