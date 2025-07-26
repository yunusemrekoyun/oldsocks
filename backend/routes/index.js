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

// core CRUD
router.use("/users", require("./users"));
router.use("/products", require("./products"));
router.use("/categories", require("./categories"));
router.use("/campaigns", require("./campaign"));
router.use("/mini-campaigns", require("./miniCampaigns"));
router.use("/orders", require("./orders"));

// blog
router.use("/blogs", require("./blog"));
router.use("/blog-categories", require("./blogCategories"));

// yorumlar
router.use("/comments", require("./blogComments"));

// ** yanıtlar için artık ayrı prefix yok, root’a mount ediyoruz **
router.use(require("./blogReplies"));

// payment
router.use("/payment", require("./payment"));

// profil resmi
router.use("/profile-pictures", require("./userProfilePictures"));

// Instagram postları
router.use("/instagram-posts", require("./instagramPostRoutes"));

module.exports = router;
