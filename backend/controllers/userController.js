// backend/controllers/userController.js
const User = require("../models/User");
const PasswordResetToken = require("../models/PasswordResetToken");
const bcrypt = require("bcrypt");
const { COOKIE_OPTIONS } = require("../utils/authTokens");
const { validatePasswordPolicy } = require("../utils/passwordPolicy");

// — Me endpoints —

// Profil bilgisi
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select(
      "-password -refreshTokens -tokenVersion"
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
    const allowedFields = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "avatar",
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "Güncellenecek alan bulunamadı." });
    }

    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const user = await User.findByIdAndUpdate(req.user.userId, updates, {
      new: true,
      runValidators: true,
    }).select("-password -refreshTokens -tokenVersion");
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
    const users = await User.find().select("-password -refreshTokens -tokenVersion");
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Kullanıcılar alınırken hata oluştu." });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "-password -refreshTokens -tokenVersion"
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
    const allowedFields = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "avatar",
      "role",
      "addresses",
      "password",
    ];
    const updates = {};
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "Güncellenecek alan bulunamadı." });
    }

    let passwordChanged = false;
    const updateDoc = { $set: {} };

    if (updates.password) {
      const validation = validatePasswordPolicy(updates.password);
      if (!validation.ok) {
        return res.status(400).json({ message: validation.message });
      }
      updateDoc.$set.password = await bcrypt.hash(updates.password, 10);
      updateDoc.$set.refreshTokens = [];
      updateDoc.$inc = { tokenVersion: 1 };
      passwordChanged = true;
    }

    for (const [key, value] of Object.entries(updates)) {
      if (key === "password") continue;
      updateDoc.$set[key] = value;
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateDoc, {
      new: true,
      runValidators: true,
    }).select("-password -refreshTokens -tokenVersion");
    if (!user)
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });

    if (passwordChanged) {
      await PasswordResetToken.deleteMany({ user: req.params.id });
    }

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

exports.changePassword = async (req, res) => {
  try {
    const currentPassword = String(req.body?.currentPassword || "");
    const newPassword = String(req.body?.newPassword || "");

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Mevcut sifre ve yeni sifre zorunludur." });
    }

    const validation = validatePasswordPolicy(newPassword);
    if (!validation.ok) {
      return res.status(400).json({ message: validation.message });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }

    const matches = await bcrypt.compare(currentPassword, user.password);
    if (!matches) {
      return res.status(400).json({ message: "Mevcut sifre hatali." });
    }

    const sameAsCurrent = await bcrypt.compare(newPassword, user.password);
    if (sameAsCurrent) {
      return res
        .status(400)
        .json({ message: "Yeni sifre mevcut sifrenizle ayni olamaz." });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.refreshTokens = [];
    user.tokenVersion = Number(user.tokenVersion || 0) + 1;
    await user.save();
    await PasswordResetToken.deleteMany({ user: user._id });

    return res
      .clearCookie("refreshToken", COOKIE_OPTIONS)
      .json({ message: "Sifreniz guncellendi. Lutfen tekrar giris yapin." });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Sifre guncellenirken hata olustu." });
  }
};
