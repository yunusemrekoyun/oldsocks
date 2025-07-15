// backend/controllers/userController.js
const User = require("../models/User");
const bcrypt = require("bcrypt");

// — Me endpoints —
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select(
      "-password -refreshTokens"
    );
    if (!user)
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Profil alınırken hata oluştu." });
  }
};

exports.updateMe = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }
    const user = await User.findByIdAndUpdate(req.user.userId, updates, {
      new: true,
    }).select("-password -refreshTokens");
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Profil güncellenirken hata oluştu." });
  }
};

// — Admin endpoints —
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password -refreshTokens");
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Kullanıcılar alınırken hata oluştu." });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "-password -refreshTokens"
    );
    if (!user)
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Kullanıcı alınırken hata oluştu." });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }
    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    }).select("-password -refreshTokens");
    if (!user)
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Güncelleme sırasında hata oluştu." });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const result = await User.findByIdAndDelete(req.params.id);
    if (!result)
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    res.json({ message: "Kullanıcı silindi." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Silme sırasında hata oluştu." });
  }
};
