// backend/controllers/userController.js
const User = require("../models/User");
const bcrypt = require("bcrypt");

// — Me endpoints —

// Profil bilgisi
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

// Profil güncelleme
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

// — Address endpoints —

// Adres listesini getir
exports.getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("addresses");
    res.json(user.addresses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Adresler alınırken hata oluştu." });
  }
};

// Yeni adres ekle
exports.addAddress = async (req, res) => {
  try {
    const { title, street, mainaddress, city, district, postalCode } = req.body;
    const user = await User.findById(req.user.userId);
    user.addresses.push({
      title,
      street,
      mainaddress,
      city,
      district,
      postalCode,
    });
    await user.save();
    res.status(201).json(user.addresses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Adres eklenirken hata oluştu." });
  }
};

// Var olan adresi güncelle
exports.updateAddress = async (req, res) => {
  try {
    const { addrId } = req.params;
    const updates = { ...req.body };
    const user = await User.findById(req.user.userId);
    const addr = user.addresses.id(addrId);
    if (!addr) return res.status(404).json({ message: "Adres bulunamadı." });
    Object.assign(addr, updates);
    await user.save();
    res.json(addr);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Adres güncellenirken hata oluştu." });
  }
};

// Adresi sil
exports.deleteAddress = async (req, res) => {
  try {
    const { addrId } = req.params;
    const user = await User.findById(req.user.userId);
    const addr = user.addresses.id(addrId);
    if (!addr) return res.status(404).json({ message: "Adres bulunamadı." });

    user.addresses.pull({ _id: addrId }); // 🔧 BURASI DEĞİŞTİ
    await user.save();

    res.sendStatus(204);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Adres silinirken hata oluştu." });
  }
};

// — Admin endpoints —
// (Bunlar değişmedi; önceki haliyle kullanabilirsiniz)
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
