// backend/server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");

const connectDB = require("./config/db");
const apiRoutes = require("./routes");

const app = express();

/* 1) DB */
connectDB();

/* 2) Güven / Proxy (Render, Railway vb. için) */
app.set("trust proxy", 1);
app.disable("x-powered-by");

/* 3) CORS (çoklu origin whitelist) */
/* 3) CORS (çoklu origin whitelist) */
const ALLOWED_ORIGINS = (process.env.FRONTEND_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// Delegate ile path + origin’e göre karar verelim
const corsOptionsDelegate = (req, cb) => {
  const origin = req.header("Origin");
  const path = req.path || "";

  // Payment rotaları → her zaman izin ver
  const isPaymentRoute = path.startsWith("/api/v1/payment/");

  // Varsayılan seçenekler
  const opts = { credentials: true, origin: true };

  // Origin yoksa (null) → izin ver (iyzico callback bu şekilde gelir)
  if (!origin) return cb(null, opts);

  // Payment rotaları → izin ver
  if (isPaymentRoute) return cb(null, opts);

  // Whitelist kontrolü
  if (ALLOWED_ORIGINS.includes(origin)) return cb(null, opts);

  // Diğer her şey → engelle
  return cb(new Error(`CORS blocked for origin: ${origin}`));
};

app.use(cors(corsOptionsDelegate));

/* 4) Güvenlik başlıkları (CSP koymadık—SPA/Cloudinary kırmasın) */
app.use(
  helmet({
    crossOriginResourcePolicy: false, // Cloudinary görüntülerinde sorun çıkmasın
  })
);

/* 5) Sıkıştırma */
app.use(compression());

/* 6) Loglama (prod: combined, dev: dev) */
if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}

/* 7) Rate limit (genel) */
const apiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 dk
  max: 600, // 10 dk'da 600 istek
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/v1", apiLimiter);

/* 8) Body parsers */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

/* 9) Healthcheck */
app.get("/healthz", (req, res) => {
  res.json({
    ok: true,
    env: process.env.NODE_ENV || "development",
    mongo: mongoose.connection.readyState, // 1 ise bağlı
  });
});

/* 10) API routes */
app.use("/api/v1", apiRoutes);

/* 11) 404 */
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

/* 12) Global error handler (CORS vb.) */
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err?.message || err);
  if (err && String(err.message || "").startsWith("CORS blocked")) {
    return res.status(403).json({ message: err.message });
  }
  res.status(500).json({ message: "Internal Server Error" });
});

/* 13) Server */
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

/* 14) Graceful shutdown (Render sigterm/sigint) */
function shutdown(signal) {
  console.log(`\n${signal} alındı. Kapanıyor...`);
  server.close(() => {
    console.log("🔻 HTTP sunucusu kapandı.");
    mongoose.connection.close(false, () => {
      console.log("🔻 Mongo bağlantısı kapandı.");
      process.exit(0);
    });
  });

  // 10 sn sonra zorla çık
  setTimeout(() => {
    console.warn("⏱  Zorunlu çıkış (timeout).");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
