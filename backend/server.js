// backend/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const apiRoutes = require("./routes");
const cookieParser = require("cookie-parser");

const app = express();

// 1) DB’ye bağlan
connectDB();

// 2) Middleware’ler
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN, // veya '*'
    credentials: true,
  })
);
app.use(express.json()); // body-parser yerine
app.use(cookieParser());
// 3) Route’ları mount et
app.use("/api/v1", apiRoutes);

// 4) Server’ı başlat
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Sunucu ayakta, port: ${PORT}`);
});
