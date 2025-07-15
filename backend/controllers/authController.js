// backend/controllers/authController.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 gün
};
const createAccessToken = (user) => {
  return jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

const createRefreshToken = (user) => {
  return jwt.sign({ userId: user._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  });
};

exports.register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      address,
      avatar,
      role,
    } = req.body;
    // 1) e-posta zaten var mı?
    if (await User.findOne({ email })) {
      return res.status(400).json({ message: "E-posta zaten kullanımda." });
    }
    // 2) şifre hash’le
    const hashed = await bcrypt.hash(password, 10);
    // 3) kullanıcıyı oluştur
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashed,
      phone,
      address,
      avatar,
      role,
    });
    // 4) token’ları üret
    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);
    // 5) refresh token’ı kaydet
    user.refreshTokens.push(refreshToken);
    await user.save();
    // 6) yanıt
    res
      .cookie("refreshToken", refreshToken, COOKIE_OPTIONS)
      .status(201)
      .json({ accessToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Kayıt işlemi başarısız." });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // 1) kullanıcıyı bul
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Geçersiz kimlik." });
    // 2) şifre karşılaştır
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Geçersiz kimlik." });
    // 3) token’ları üret ve kaydet
    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);
    user.refreshTokens.push(refreshToken);
    await user.save();
    // 4) yanıt
    res
      .cookie("refreshToken", refreshToken, COOKIE_OPTIONS)
      .json({ accessToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Giriş işlemi başarısız." });
  }
};

exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) return res.status(401).json({ message: "Token yok." });
    // 1) DB’de kayıtlı mı?
    const user = await User.findOne({ refreshTokens: refreshToken });
    if (!user) return res.status(403).json({ message: "Geçersiz token." });
    // 2) token’ı doğrula
    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    // 3) yeni token’lar
    const newAccessToken = createAccessToken(user);
    const newRefreshToken = createRefreshToken(user);
    // 4) eski refresh’i sil, yeniyi ekle
    user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
    user.refreshTokens.push(newRefreshToken);
    await user.save();
    // 5) yanıt
    res
      .cookie("refreshToken", newRefreshToken, COOKIE_OPTIONS)
      .json({ accessToken: newAccessToken });
  } catch (err) {
    console.error(err);
    res.status(403).json({ message: "Token yenileme başarısız." });
  }
};

exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) return res.sendStatus(204);
    // refresh token'ı DB’den temizle
    await User.updateOne(
      { refreshTokens: refreshToken },
      { $pull: { refreshTokens: refreshToken } }
    );
    res.clearCookie("refreshToken", COOKIE_OPTIONS).sendStatus(204);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Çıkış yapılamadı." });
  }
};
