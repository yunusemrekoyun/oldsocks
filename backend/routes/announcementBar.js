const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/announcementBarController");

// Eğer projede auth/role middleware’leri varsa burada ekle:
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");
// Örn:
// const requireAuth = auth.protect;
// const requireAdmin = roles.authorize("admin");

// Public: aktif bar
router.get("/", ctrl.getPublicBar);

// Admin: oku & yaz
// Not: aşağıdaki iki satırı projedeki gerçek middleware isimlerine göre açın.
// router.get("/admin", requireAuth, requireAdmin, ctrl.getAdminBar);
// router.put("/admin", requireAuth, requireAdmin, ctrl.upsertBar);

// Geçici (middleware eklenene kadar) — KALDIRMAYI UNUTMA
router.get("/admin", ctrl.getAdminBar);
router.put("/admin", ctrl.upsertBar);

// Opsiyonel: tamamen sil (admin)
// router.delete("/admin", requireAuth, requireAdmin, ctrl.deleteBar);
router.delete("/admin", ctrl.deleteBar);

module.exports = router;
