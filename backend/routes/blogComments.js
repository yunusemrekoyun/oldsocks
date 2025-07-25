// backend/routes/blogComments.js
const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const { allowRoles } = require("../middleware/roles");
const ctrl = require("../controllers/blogCommentController");

// Admin paneli
router.get("/", verifyToken, allowRoles("admin"), ctrl.getAllComments);
router.get("/:id", verifyToken, allowRoles("admin"), ctrl.getComment);
router.patch(
  "/:id/approve",
  verifyToken,
  allowRoles("admin"),
  ctrl.approveComment
);

// Public ve kullanıcı
router.get("/blogs/:blogId/comments", ctrl.getCommentsByBlog);
router.post("/blogs/:blogId/comments", verifyToken, ctrl.createComment);

// Silme
router.delete("/:id", verifyToken, ctrl.deleteComment);

module.exports = router;
