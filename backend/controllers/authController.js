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

// — REGISTER —
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
      console.log(`[Auth][Register] E-posta zaten kullanımda: ${email}`);
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

    console.log(
      `[Auth][Register] Yeni kullanıcı: ${user._id}, email: ${email}`
    );

    // 6) yanıt
    res
      .cookie("refreshToken", refreshToken, COOKIE_OPTIONS)
      .status(201)
      .json({ accessToken });
  } catch (err) {
    console.error("[Auth][Register] Hata:", err);
    res.status(500).json({ message: "Kayıt işlemi başarısız." });
  }
};

// — LOGIN —
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1) kullanıcıyı bul
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`[Auth][Login] Geçersiz kimlik: ${email}`);
      return res.status(401).json({ message: "Geçersiz kimlik." });
    }

    // 2) şifre karşılaştır
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      console.log(`[Auth][Login] Şifre yanlış: ${email}`);
      return res.status(401).json({ message: "Geçersiz kimlik." });
    }

    // 3) token’ları üret ve kaydet
    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);
    user.refreshTokens.push(refreshToken);
    await user.save();

    console.log(`[Auth][Login] Başarılı giriş: ${user._id}, email: ${email}`);

    // 4) yanıt
    res
      .cookie("refreshToken", refreshToken, COOKIE_OPTIONS)
      .json({ accessToken });
  } catch (err) {
    console.error("[Auth][Login] Hata:", err);
    res.status(500).json({ message: "Giriş işlemi başarısız." });
  }
};

// — REFRESH —
exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    console.log(
      "[Auth][Refresh] İstek alındı, refreshToken cookie:",
      refreshToken
    );

    if (!refreshToken) {
      console.log("[Auth][Refresh] Başarısız: refreshToken yok");
      return res.status(401).json({ message: "Token yok." });
    }

    // 1) DB’de kayıtlı mı?
    const user = await User.findOne({ refreshTokens: refreshToken });
    if (!user) {
      console.log("[Auth][Refresh] Başarısız: Token DB’de bulunamadı");
      return res.status(403).json({ message: "Geçersiz token." });
    }

    // 2) token’ı doğrula
    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    console.log(`[Auth][Refresh] Token geçerli, userId=${user._id}`);

    // 3) yeni token’lar
    const newAccessToken = createAccessToken(user);
    const newRefreshToken = createRefreshToken(user);

    // 4) eski refresh’i sil, yeniyi ekle
    user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
    user.refreshTokens.push(newRefreshToken);
    await user.save();

    console.log(`[Auth][Refresh] Yeni tokenlar üretildi, userId=${user._id}`);

    // 5) yanıt
    res
      .cookie("refreshToken", newRefreshToken, COOKIE_OPTIONS)
      .json({ accessToken: newAccessToken });
  } catch (err) {
    console.error("[Auth][Refresh] Token yenileme hatası:", err);
    res.status(403).json({ message: "Token yenileme başarısız." });
  }
};

// — LOGOUT —
exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    console.log(
      "[Auth][Logout] İstek alındı, refreshToken cookie:",
      refreshToken
    );

    if (!refreshToken) {
      console.log("[Auth][Logout] Cookie’de token yok, 204 dönülüyor");
      return res.sendStatus(204);
    }

    // refresh token'ı DB’den temizle
    await User.updateOne(
      { refreshTokens: refreshToken },
      { $pull: { refreshTokens: refreshToken } }
    );

    console.log(`[Auth][Logout] Token DB’den silindi, token=${refreshToken}`);

    res.clearCookie("refreshToken", COOKIE_OPTIONS).sendStatus(204);
  } catch (err) {
    console.error("[Auth][Logout] Hata:", err);
    res.status(500).json({ message: "Çıkış yapılamadı." });
  }
};
