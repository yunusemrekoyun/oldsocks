// backend/controllers/userProfilePictureController.js
const UserProfilePicture = require("../models/UserProfilePicture");
const User = require("../models/User");
const cloudinary = require("../config/cloudinary");

// GET /api/v1/profile-pictures  (kendi resmi)
exports.getMyProfilePicture = async (req, res) => {
  try {
    const pic = await UserProfilePicture.findOne({ user: req.user.userId });
    if (!pic) return res.status(404).json({ message: "Profil fotoğrafı yok." });
    res.json(pic);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Resim alınırken hata oluştu." });
  }
};

// POST /api/v1/profile-pictures   (yeni veya güncelle)
exports.createOrUpdateProfilePicture = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "Dosya bulunamadı." });

    // CloudinaryStorage zaten yükledi, req.file.path ve req.file.filename hazır
    const { path: secure_url, filename: publicId } = req.file;

    // Var olan kaydı bul, Cloudinary’den sil
    const existing = await UserProfilePicture.findOne({
      user: req.user.userId,
    });
    if (existing) {
      await cloudinary.uploader.destroy(existing.publicId);
    }

    // DB’ye kaydet veya güncelle
    const pic = await UserProfilePicture.findOneAndUpdate(
      { user: req.user.userId },
      { url: secure_url, publicId, user: req.user.userId },
      { upsert: true, new: true }
    );

    // User.avatar alanını da güncelle
    await User.findByIdAndUpdate(req.user.userId, { avatar: secure_url });

    res.status(existing ? 200 : 201).json(pic);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Resim yüklenirken hata oluştu." });
  }
};

// DELETE /api/v1/profile-pictures
exports.deleteProfilePicture = async (req, res) => {
  try {
    const pic = await UserProfilePicture.findOne({ user: req.user.userId });
    if (!pic) return res.status(404).json({ message: "Profil fotoğrafı yok." });

    // Cloudinary ve DB’den sil
    await cloudinary.uploader.destroy(pic.publicId);
    await UserProfilePicture.deleteOne({ user: req.user.userId });
    await User.findByIdAndUpdate(req.user.userId, { $unset: { avatar: "" } });

    res.json({ message: "Profil fotoğrafı silindi." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Resim silinirken hata oluştu." });
  }
};
