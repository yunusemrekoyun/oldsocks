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

// hero videolar (yeni) 👇
router.use("/hero-videos", require("./heroVideo"));

// Instagram postları
router.use("/instagram-posts", require("./instagramPostRoutes"));

router.use("/discounts", require("./discounts"));

router.use("/contact", require("./contact"));

router.use("/newsletter", require("./newsletter"));
router.use("/shipping", require("./shipping"));
/* --- İNDİRİM KURALLARI (YENİ) --- */
// /api/v1/discount-rules altında hizmet verir
// router.use("/discount-rules", require("./discountRuleRoutes"));

router.use("/announcement-bar", require("./announcementBar"));

module.exports = router;
