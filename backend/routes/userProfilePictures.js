// backend/routes/userProfilePictures.js
const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const uploadProfilePicture = require("../middleware/uploadProfilePicture");
const ctrl = require("../controllers/userProfilePictureController");

// GET kendi resmim
router.get("/", verifyToken, ctrl.getMyProfilePicture);

// POST yeni veya güncelle
router.post(
  "/",
  verifyToken,
  (req, res, next) => {
    console.log("🔑 verifyToken geçti, req.user:", req.user);
    next();
  },
  uploadProfilePicture.single("picture"),
  (req, res, next) => {
    console.log("📂 multer upload geçti, req.file:", req.file);
    next();
  },
  ctrl.createOrUpdateProfilePicture
);
router.post(
  "/test",
  verifyToken,
  uploadProfilePicture.single("picture"),
  (req, res) => {
    res.json({ file: req.file });
  }
);
// DELETE sil
router.delete("/", verifyToken, ctrl.deleteProfilePicture);

module.exports = router;
