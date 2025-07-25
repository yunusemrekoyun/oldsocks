const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const { allowRoles } = require("../middleware/roles");
const ctrl = require("../controllers/blogReplyController");

// — Admin paneli için —
// Tüm yanıtları listele (approved filtresiyle)
router.get("/replies", verifyToken, allowRoles("admin"), ctrl.getAllReplies);
// Tek bir yanıtı getir
router.get("/replies/:id", verifyToken, allowRoles("admin"), ctrl.getReply);
// Yanıtı onayla
router.patch(
  "/replies/:id/approve",
  verifyToken,
  allowRoles("admin"),
  ctrl.approveReply
);

// — Public / Kullanıcı işlemleri —
// Bir yorumun sadece onaylı yanıtlarını getir
router.get("/comments/:commentId/replies", ctrl.getRepliesByComment);
// Yeni yanıt ekle (login required)
router.post("/comments/:commentId/replies", verifyToken, ctrl.createReply);

// — Silme (sahibi veya admin) —
// Yanıt sil
router.delete("/replies/:id", verifyToken, ctrl.deleteReply);

module.exports = router;
