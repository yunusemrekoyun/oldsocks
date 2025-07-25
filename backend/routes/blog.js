// backend/routes/blogs.js
const express = require("express");
const router = express.Router();

const blogCtrl = require("../controllers/blogController");
const { verifyToken } = require("../middleware/auth");
const { allowRoles } = require("../middleware/roles");
const { uploadBlogCover } = require("../middleware/upload");

// Public
router.get("/", blogCtrl.getBlogs);
router.get("/:slugOrId", blogCtrl.getBlog);

// Admin
router.post(
  "/",
  verifyToken,
  allowRoles("admin"),
  uploadBlogCover.single("coverImage"), // artık tanımlı!
  blogCtrl.createBlog
);

router.put(
  "/:id",
  verifyToken,
  allowRoles("admin"),
  uploadBlogCover.single("coverImage"),
  blogCtrl.updateBlog
);

router.delete("/:id", verifyToken, allowRoles("admin"), blogCtrl.deleteBlog);

module.exports = router;
