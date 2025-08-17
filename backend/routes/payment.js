const router = require("express").Router();
const { verifyToken } = require("../middleware/auth");
const paymentCtrl = require("../controllers/paymentController");

/** Route’a özel CSP (sadece İyzico assetlerine izin) */
const allowIyzicoCSP = (req, res, next) => {
  const IYZ = [
    "https://sandbox-api.iyzipay.com",
    "https://sandbox-static.iyzipay.com",
    "https://cdnsandbox.iyzipay.com",
    "https://cdn.iyzipay.com",
    "https://*.iyzico.com",
    "https://*.iyzi.link",
  ].join(" ");

  const EXTRA_CONNECT = "https://*.sentry.io"; // sadece konsol uyarısı kesmek için

  res.removeHeader("Content-Security-Policy");
  res.setHeader(
    "Content-Security-Policy",
    [
      `default-src 'self' ${IYZ}`,
      `script-src 'self' 'unsafe-inline' ${IYZ}`,
      `script-src-elem 'self' 'unsafe-inline' ${IYZ}`,
      `style-src 'self' 'unsafe-inline' ${IYZ}`,
      `img-src 'self' data: blob: ${IYZ}`,
      `font-src 'self' data: ${IYZ}`,
      `connect-src 'self' ${IYZ} ${EXTRA_CONNECT}`,
      `frame-src ${IYZ}`,
      `worker-src 'self' blob:`,
      `frame-ancestors 'self'`,
    ].join("; ")
  );
  res.removeHeader("X-Frame-Options");
  res.removeHeader("Cross-Origin-Opener-Policy");
  res.removeHeader("Cross-Origin-Embedder-Policy");
  next();
};

// 1) Front → XHR → backend (auth gerekiyor)
router.post("/start", verifyToken, paymentCtrl.startPaymentSession);

// 2) Front → GET (embed için HTML döner) — PUBLIC
router.get(
  "/inline/:conversationId",
  allowIyzicoCSP,
  paymentCtrl.inlineCheckoutHtml
);

// (İstersen dursun: full-page yönlendirme sürümü — PUBLIC)
router.get(
  "/forward/:conversationId",
  allowIyzicoCSP,
  paymentCtrl.forwardToIyzico
);

// 3) İyzico callback — PUBLIC
router.get("/callback", paymentCtrl.paymentCallback);
router.post("/callback", paymentCtrl.paymentCallback);

module.exports = router;
