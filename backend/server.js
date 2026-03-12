// backend/server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const mongoose = require("mongoose");

const connectDB = require("./config/db");
const apiRoutes = require("./routes");

const app = express();

/* 1) DB */
connectDB();

/* 2) Güven / Proxy (Render, Railway vb. için) */
app.set("trust proxy", 1); // gerçek istemci IP’si için
app.disable("x-powered-by");

/* 3) CORS (çoklu origin whitelist) */
const ALLOWED_ORIGINS = (process.env.FRONTEND_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const corsOptionsDelegate = (req, cb) => {
  const origin = req.header("Origin");
  const path = req.path || "";
  const isPaymentRoute = path.startsWith("/api/v1/payment/");
  const opts = { credentials: true, origin: true };

  if (!origin) return cb(null, opts);
  if (isPaymentRoute) return cb(null, opts);
  if (ALLOWED_ORIGINS.includes(origin)) return cb(null, opts);

  return cb(new Error(`CORS blocked for origin: ${origin}`));
};

app.use(cors(corsOptionsDelegate));

/* 4) Güvenlik başlıkları */
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

/* 5) Sıkıştırma */
app.use(compression());

/* 6) Loglama */
if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}

/* --- Rate Limit Helpers --- */
const skipPreflight = (req) =>
  req.method === "OPTIONS" || req.method === "HEAD";
const keyByIp = (req) => ipKeyGenerator(req.ip);

/* 7) Rate limit (rotaya göre) */

/**
 * Genel limit (catch-all)
 * - 10 dakikada 600 istek/IP
 * - OPTIONS/HEAD sayılmaz
 * - Başarılı (2xx/3xx) istekler sayılmaz → 304 yağmuru kotayı yemez
 */
const generalLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipPreflight,
  keyGenerator: keyByIp,
  skipSuccessfulRequests: true,
});

/**
 * Okuma-ağırlıklı uçlar (daha geniş)
 * - 1 dakikada 300 istek/IP
 * - Başarılılar sayılmaz
 */
const readHeavyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipPreflight,
  keyGenerator: keyByIp,
  skipSuccessfulRequests: true,
});

/**
 * Kritik uçlar (auth/payment/admin) — daha sıkı
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 80,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipPreflight,
  keyGenerator: keyByIp,
  skipSuccessfulRequests: true,
});

const paymentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipPreflight,
  keyGenerator: keyByIp,
  skipSuccessfulRequests: true,
});

const adminLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipPreflight,
  keyGenerator: keyByIp,
  skipSuccessfulRequests: true,
});

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipPreflight,
  keyGenerator: keyByIp,
});

const newsletterLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipPreflight,
  keyGenerator: keyByIp,
});

/* 8) Body parsers */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

/* 9) Healthcheck (limitleme yok) */
app.get("/healthz", (req, res) => {
  res.json({
    ok: true,
    env: process.env.NODE_ENV || "development",
    mongo: mongoose.connection.readyState, // 1 ise bağlı
  });
});

/* 10) Rate limit uygulaması (sıra önemli) */
/* Okuma-ağırlıklı GET uçları: daha geniş limiter */
app.use(
  [
    "/api/v1/products",
    "/api/v1/categories",
    "/api/v1/mini-campaigns",
    "/api/v1/shipping",
    "/api/v1/announcement-bar",
    "/api/v1/cart-campaigns",
  ],
  readHeavyLimiter
);

/* Kritik uçlar */
app.use("/api/v1/auth", authLimiter);
app.use("/api/v1/payment", paymentLimiter);
app.use("/api/v1/admin", adminLimiter);
app.use("/api/v1/contact", contactLimiter);
app.use("/api/v1/newsletter/subscribe", newsletterLimiter);

/* Geri kalan tüm API: genel limiter */
app.use("/api/v1", generalLimiter);

/* 11) API routes */
app.use("/api/v1", apiRoutes);

/* 12) 404 */
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

/* 13) Global error handler (CORS vb.) */
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err?.message || err);
  if (err && String(err.message || "").startsWith("CORS blocked")) {
    return res.status(403).json({ message: err.message });
  }
  if (err?.code === "LIMIT_FILE_SIZE") {
    return res
      .status(400)
      .json({
        message: "Yüklenen dosya çok büyük. Lütfen daha küçük bir dosya deneyin.",
      });
  }
  if (Number.isInteger(err?.statusCode)) {
    return res
      .status(err.statusCode)
      .json({ message: err.message || "Islem tamamlanamadi." });
  }
  res.status(500).json({ message: "Internal Server Error" });
});

/* 14) Server */
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`✅ Sunucu ayakta, port: ${PORT}`);
  if (ALLOWED_ORIGINS.length) {
    console.log("🔒 CORS whitelist:", ALLOWED_ORIGINS.join(", "));
  } else {
    console.log(
      "⚠️  CORS whitelist boş. FRONTEND_ORIGIN env değişkenini ayarla (virgülle çoklu domain)."
    );
  }
});

/* 15) Graceful shutdown */
function shutdown(signal) {
  console.log(`\n${signal} alındı. Kapanıyor...`);
  server.close(async () => {
    console.log("🔻 HTTP sunucusu kapandı.");
    try {
      await mongoose.connection.close();
      console.log("🔻 Mongo bağlantısı kapandı.");
      process.exit(0);
    } catch (err) {
      console.error("❌ Mongo bağlantısı kapatılırken hata:", err);
      process.exit(1);
    }
  });

  setTimeout(() => {
    console.warn("⏱  Zorunlu çıkış (timeout).");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
