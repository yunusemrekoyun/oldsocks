require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");

const connectDB = require("./config/db");
const apiRoutes = require("./routes");

const app = express();

/* 1) DB’ye bağlan */
connectDB();

/* 2) Middleware’ler */
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN, // gerekirse '*' yapabilirsin
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* 3) Route’ları mount et */
app.use("/api/v1", apiRoutes);

/* 4) Discount scheduler’ı DB bağlantısı hazır olunca başlat */
let discountScheduler;
mongoose.connection.once("open", () => {
  try {
    // jobs/discountScheduler.js dosyası daha önce paylaştığım gibi start/stop export etmeli
    discountScheduler = require("./jobs/discountScheduler");
    if (discountScheduler?.start) {
      discountScheduler.start();
      console.log("📅 Discount scheduler başlatıldı.");
    }
  } catch (err) {
    console.error("Discount scheduler başlatılamadı:", err);
  }
});

/* Graceful shutdown (opsiyonel ama önerilir) */
process.on("SIGINT", async () => {
  try {
    if (discountScheduler?.stop) {
      await discountScheduler.stop();
      console.log("📅 Discount scheduler durduruldu.");
    }
    await mongoose.connection.close();
  } catch (e) {
    // ignore
  } finally {
    process.exit(0);
  }
});

/* 5) Server’ı başlat */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Sunucu ayakta, port: ${PORT}`);
});