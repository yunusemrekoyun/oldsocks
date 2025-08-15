// backend/routes/discountRuleRoutes.js
const express = require("express");
const router = express.Router();

const ctrl = require("../controllers/discountRuleController");
// dilersen verifyToken/allowRoles ekleyebilirsin
// const { verifyToken } = require("../middleware/auth");
// const { allowRoles } = require("../middleware/roles");

// Listele
router.get("/", ctrl.list);

// Oluştur
router.post("/", ctrl.create);

// Güncelle
router.put("/:id", ctrl.update);

// Sil
router.delete("/:id", ctrl.remove);

// Aktifleştir
router.patch("/:id/activate", ctrl.activate);

module.exports = router;