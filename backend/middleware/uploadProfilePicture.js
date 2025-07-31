// backend/middleware/uploadProfilePicture.js
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// Tek sorumluluk: kullanıcı profil resmi
const profilePictureStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "user_profile_pictures",
    resource_type: "image",
    format: "png",
    public_id: `profile_${req.user.id || req.user.userId}_${Date.now()}`,
  }),
});

const uploadProfilePicture = multer({
  storage: profilePictureStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // max 2MB
  fileFilter: (req, file, cb) => {
    // Sadece image/* kabul et
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Sadece resim dosyalarına izin verilir"), false);
    }
    cb(null, true);
  },
});

module.exports = uploadProfilePicture;
