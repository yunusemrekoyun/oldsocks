const express = require("express");
const router = express.Router();

const blogCtrl = require("../controllers/blogController");
const { verifyToken } = require("../middleware/auth");
const { allowRoles } = require("../middleware/roles");
const { uploadBlogCover } = require("../middleware/upload");

// — Public —
// Tüm bloglar (isteğe bağlı ?tag=tagName ile filtrelenebilir)
router.get("/tags", blogCtrl.getTags);
router.get("/", blogCtrl.getBlogs);
// Tek bir blog (slug veya ID ile)
router.get("/:slugOrId", blogCtrl.getBlog);

// — Admin —
// Yeni blog oluştur (coverImage dosyası)
router.post(
  "/",
  verifyToken,
  allowRoles("admin"),
  uploadBlogCover.single("coverImage"),
  blogCtrl.createBlog
);

// Mevcut blogu güncelle
router.put(
  "/:id",
  verifyToken,
  allowRoles("admin"),
  uploadBlogCover.single("coverImage"),
  blogCtrl.updateBlog
);

// Blog sil
router.delete("/:id", verifyToken, allowRoles("admin"), blogCtrl.deleteBlog);

module.exports = router;
