// backend/routes/userProfilePictures.js
const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const { uploadProfilePicture } = require("../middleware/upload");
const ctrl = require("../controllers/userProfilePictureController");

// YENİ / GÜNCELLE
router.post(
  "/",
  verifyToken,
  uploadProfilePicture.single("picture"),
  ctrl.createOrUpdateProfilePicture
);

// KENDİ profil resmini getir
router.get("/", verifyToken, ctrl.getMyProfilePicture);

// SİL
router.delete("/", verifyToken, ctrl.deleteProfilePicture);

module.exports = router;
