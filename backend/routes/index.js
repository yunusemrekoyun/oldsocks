// backend/routes/index.js
const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middleware/auth");
const { allowRoles } = require("../middleware/roles");

// Sağlık kontrolü
router.get("/", (req, res) => res.json({ message: "API çalışıyor 🚀" }));

// sadece login’li
router.get("/protected", verifyToken, (req, res) =>
  res.json({ message: "Buraya eriştin!", user: req.user })
);

// sadece admin
router.get("/admin-only", verifyToken, allowRoles("admin"), (req, res) =>
  res.json({ message: "Admin paneline hoş geldin." })
);

// auth
router.use("/auth", require("./auth"));

// users, products, categories, campaigns, mini-campaigns, orders…
router.use("/users", require("./users"));
router.use("/products", require("./products"));
router.use("/categories", require("./categories"));
router.use("/campaigns", require("./campaign"));
router.use("/mini-campaigns", require("./miniCampaigns"));
router.use("/orders", require("./orders"));

// blog & blog-categories
router.use("/blogs", require("./blog"));
router.use("/blog-categories", require("./blogCategories"));

// ** Yorum / yanıt rotaları buraya **
// artık /comments/... ve /replies/... altında çalışacak
router.use("/comments", require("./blogComments"));
router.use("/replies", require("./blogReplies"));

// payment
router.use("/payment", require("./payment"));

// user profile picture
router.use("/profile-pictures", require("./userProfilePictures"));

module.exports = router;
