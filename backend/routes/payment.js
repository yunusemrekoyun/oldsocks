// backend/routes/payment.js
const router = require("express").Router();
const { verifyToken } = require("../middleware/auth");
const paymentCtrl = require("../controllers/paymentController");

// 1) Ödeme başlatma (korumalı)
router.post("/create-redirect", verifyToken, paymentCtrl.createPaymentRedirect);

// 2) Iyzico dönüşü (hem GET hem POST gelebilsin)
router.get("/callback", paymentCtrl.paymentCallback);
router.post("/callback", paymentCtrl.paymentCallback);

module.exports = router;
