// backend/routes/index.js
const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middleware/auth");
const { allowRoles } = require("../middleware/roles");

// Sağlık kontrolü
router.get("/", (req, res) => {
  res.json({ message: "API çalışıyor 🚀" });
});

// sadece giriş yapmış kullanıcılar
router.get("/protected", verifyToken, (req, res) => {
  res.json({
    message: "Buraya eriştin!",
    user: req.user,
  });
});

// sadece admin rolündekiler
router.get("/admin-only", verifyToken, allowRoles("admin"), (req, res) => {
  res.json({ message: "Admin paneline hoş geldin." });
});

// auth rotalarını bağla
router.use("/auth", require("./auth"));

// users rotalarını bağla (getMe, updateMe, admin CRUD)
router.use("/users", require("./users"));
router.use("/products", require("./products"));
router.use("/categories", require("./categories"));

// orders rotaları
router.use("/orders", require("./orders"));


//payment routes
router.use("/payment", require("./payment"));
module.exports = router;
