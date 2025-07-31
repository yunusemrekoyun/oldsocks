// backend/controllers/userProfilePictureController.js
const UserProfilePicture = require("../models/UserProfilePicture");
const User = require("../models/User");
const cloudinary = require("../config/cloudinary");

exports.getMyProfilePicture = async (req, res) => {
  try {
    const pic = await UserProfilePicture.findOne({
      user: req.user.id || req.user.userId,
    });
    if (!pic) return res.status(404).json({ message: "Profil fotoğrafı yok." });
    res.json(pic);
  } catch (err) {
    console.error("getMyProfilePicture:", err);
    res.status(500).json({ message: "Resim alınırken hata oluştu." });
  }
};

exports.createOrUpdateProfilePicture = async (req, res) => {
  try {
    // dosya multer’dan gelmeli
    if (!req.file) {
      return res.status(400).json({ message: "Dosya bulunamadı." });
    }

    const userId = req.user.id || req.user.userId;
    const secure_url = req.file.path || req.file.url;
    const publicId = req.file.filename || req.file.public_id;

    // var ise eskisini sil
    const existing = await UserProfilePicture.findOne({ user: userId });
    if (existing) {
      await cloudinary.uploader.destroy(existing.publicId);
    }

    // upsert et
    const pic = await UserProfilePicture.findOneAndUpdate(
      { user: userId },
      { user: userId, url: secure_url, publicId },
      { upsert: true, new: true, runValidators: true }
    );

    // Kullanıcının avatar alanına da yaz
    await User.findByIdAndUpdate(userId, { avatar: secure_url });

    res.status(existing ? 200 : 201).json(pic);
  } catch (err) {
    console.error("createOrUpdateProfilePicture:", err);
    res
      .status(500)
      .json({ message: err.message || "Resim yüklenirken hata oluştu." });
  }
};

exports.deleteProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const pic = await UserProfilePicture.findOne({ user: userId });
    if (!pic) return res.status(404).json({ message: "Profil fotoğrafı yok." });

    // Cloudinary’den sil, DB’den sil, User.avatar’ı temizle
    await cloudinary.uploader.destroy(pic.publicId);
    await UserProfilePicture.deleteOne({ user: userId });
    await User.findByIdAndUpdate(userId, { $unset: { avatar: "" } });

    res.json({ message: "Profil fotoğrafı silindi." });
  } catch (err) {
    console.error("deleteProfilePicture:", err);
    res.status(500).json({ message: "Resim silinirken hata oluştu." });
  }
};
