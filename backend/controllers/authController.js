const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const PasswordResetToken = require("../models/PasswordResetToken");
const { sendPasswordResetMail } = require("../utils/mailer");
const {
  COOKIE_OPTIONS,
  createAccessToken,
  createRefreshToken,
} = require("../utils/authTokens");
const { validatePasswordPolicy } = require("../utils/passwordPolicy");
const {
  createPasswordResetToken,
  getPasswordResetExpiryDate,
  hashPasswordResetToken,
} = require("../utils/passwordReset");
const {
  isValidEmailAddress,
  normalizeEmailAddress,
} = require("../utils/email");

const GENERIC_RESET_RESPONSE = {
  message:
    "Eger bu e-posta ile kayitli bir hesap varsa, sifre sifirlama baglantisi gonderildi.",
};

function getPrimaryFrontendOrigin() {
  return (
    String(process.env.FRONTEND_ORIGIN || "")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)[0] || "http://localhost:5173"
  );
}

function validatePasswordInput(password) {
  const result = validatePasswordPolicy(password);
  if (!result.ok) {
    const err = new Error(result.message || "Sifre kurallari saglanmiyor.");
    err.statusCode = 400;
    throw err;
  }
}

function sanitizeEmailOrThrow(email) {
  const normalizedEmail = normalizeEmailAddress(email);
  if (!isValidEmailAddress(normalizedEmail)) {
    const err = new Error("Gecerli bir e-posta girin.");
    err.statusCode = 400;
    throw err;
  }
  return normalizedEmail;
}

async function invalidateSessions(user) {
  user.refreshTokens = [];
  user.tokenVersion = Number(user.tokenVersion || 0) + 1;
  await user.save();
}

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

    const normalizedEmail = sanitizeEmailOrThrow(email);
    validatePasswordInput(password);

    if (role && role !== "user") {
      console.warn(
        `[Auth][Register] Role override attempt blocked for email ${normalizedEmail}`
      );
    }

    if (await User.findOne({ email: normalizedEmail })) {
      console.log(`[Auth][Register] E-posta zaten kullanımda: ${normalizedEmail}`);
      return res.status(400).json({ message: "E-posta zaten kullanımda." });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstName,
      lastName,
      email: normalizedEmail,
      password: hashed,
      phone,
      address,
      avatar,
      role: "user",
    });

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    user.refreshTokens.push(refreshToken);
    await user.save();

    console.log(
      `[Auth][Register] Yeni kullanıcı: ${user._id}, email: ${normalizedEmail}`
    );

    res
      .cookie("refreshToken", refreshToken, COOKIE_OPTIONS)
      .status(201)
      .json({ accessToken });
  } catch (err) {
    console.error("[Auth][Register] Hata:", err);
    res
      .status(err.statusCode || 500)
      .json({ message: err.message || "Kayıt işlemi başarısız." });
  }
};

exports.login = async (req, res) => {
  try {
    const normalizedEmail = sanitizeEmailOrThrow(req.body?.email);
    const { password } = req.body;

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      console.log(`[Auth][Login] Geçersiz kimlik: ${normalizedEmail}`);
      return res.status(401).json({ message: "Geçersiz kimlik." });
    }

    const ok = await bcrypt.compare(String(password || ""), user.password);
    if (!ok) {
      console.log(`[Auth][Login] Şifre yanlış: ${normalizedEmail}`);
      return res.status(401).json({ message: "Geçersiz kimlik." });
    }

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);
    user.refreshTokens.push(refreshToken);
    await user.save();

    console.log(
      `[Auth][Login] Başarılı giriş: ${user._id}, email: ${normalizedEmail}`
    );

    res
      .cookie("refreshToken", refreshToken, COOKIE_OPTIONS)
      .json({ accessToken });
  } catch (err) {
    console.error("[Auth][Login] Hata:", err);
    res
      .status(err.statusCode || 500)
      .json({ message: err.message || "Giriş işlemi başarısız." });
  }
};

exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return res.status(401).json({ message: "Token yok." });
    }

    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(payload.userId);
    if (!user) {
      res.clearCookie("refreshToken", COOKIE_OPTIONS);
      return res.status(403).json({ message: "Geçersiz token." });
    }

    const stored = Array.isArray(user.refreshTokens)
      ? user.refreshTokens.includes(refreshToken)
      : false;
    const payloadTokenVersion = Number(payload?.tokenVersion || 0);
    const currentTokenVersion = Number(user?.tokenVersion || 0);

    if (!stored || payloadTokenVersion !== currentTokenVersion) {
      user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
      await user.save();
      res.clearCookie("refreshToken", COOKIE_OPTIONS);
      return res.status(403).json({ message: "Geçersiz token." });
    }

    const newAccessToken = createAccessToken(user);
    const newRefreshToken = createRefreshToken(user);

    user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
    user.refreshTokens.push(newRefreshToken);
    await user.save();

    res
      .cookie("refreshToken", newRefreshToken, COOKIE_OPTIONS)
      .json({ accessToken: newAccessToken });
  } catch (err) {
    console.error("[Auth][Refresh] Token yenileme hatası:", err?.message || err);
    res.clearCookie("refreshToken", COOKIE_OPTIONS);
    res.status(403).json({ message: "Token yenileme başarısız." });
  }
};

exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return res.clearCookie("refreshToken", COOKIE_OPTIONS).sendStatus(204);
    }

    await User.updateOne(
      { refreshTokens: refreshToken },
      { $pull: { refreshTokens: refreshToken } }
    );

    res.clearCookie("refreshToken", COOKIE_OPTIONS).sendStatus(204);
  } catch (err) {
    console.error("[Auth][Logout] Hata:", err);
    res.status(500).json({ message: "Çıkış yapılamadı." });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const normalizedEmail = normalizeEmailAddress(req.body?.email);
    if (!isValidEmailAddress(normalizedEmail)) {
      return res.status(400).json({ message: "Gecerli bir e-posta girin." });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.json(GENERIC_RESET_RESPONSE);
    }

    await PasswordResetToken.deleteMany({ user: user._id });

    const rawToken = createPasswordResetToken();
    const tokenHash = hashPasswordResetToken(rawToken);
    const expiresAt = getPasswordResetExpiryDate();

    await PasswordResetToken.create({
      user: user._id,
      tokenHash,
      expiresAt,
      requestIp: req.ip || null,
      userAgent: String(req.get("user-agent") || "").slice(0, 300) || null,
    });

    const resetLink = `${getPrimaryFrontendOrigin()}/reset-password?token=${encodeURIComponent(
      rawToken
    )}`;

    try {
      await sendPasswordResetMail({
        user,
        resetLink,
        expiresAt,
      });
    } catch (mailError) {
      console.error("[Auth][ForgotPassword] Mail gönderimi başarısız:", mailError);
    }

    return res.json(GENERIC_RESET_RESPONSE);
  } catch (err) {
    console.error("[Auth][ForgotPassword] Hata:", err);
    return res.status(500).json(GENERIC_RESET_RESPONSE);
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const rawToken = String(req.body?.token || "").trim();
    const password = String(req.body?.password || "");

    if (!rawToken) {
      return res.status(400).json({ message: "Gecersiz veya eksik sifre sifirlama linki." });
    }

    validatePasswordInput(password);

    const tokenHash = hashPasswordResetToken(rawToken);
    const resetRecord = await PasswordResetToken.findOne({
      tokenHash,
      expiresAt: { $gt: new Date() },
    });

    if (!resetRecord) {
      return res
        .status(400)
        .json({ message: "Sifre sifirlama linki gecersiz veya suresi dolmus." });
    }

    const user = await User.findById(resetRecord.user);
    if (!user) {
      await PasswordResetToken.deleteOne({ _id: resetRecord._id });
      return res
        .status(400)
        .json({ message: "Sifre sifirlama linki gecersiz veya suresi dolmus." });
    }

    const sameAsCurrent = await bcrypt.compare(password, user.password);
    if (sameAsCurrent) {
      return res
        .status(400)
        .json({ message: "Yeni sifre mevcut sifrenizle ayni olamaz." });
    }

    user.password = await bcrypt.hash(password, 10);
    await invalidateSessions(user);
    await PasswordResetToken.deleteMany({ user: user._id });

    return res.json({
      message: "Sifreniz guncellendi. Giris yapabilirsiniz.",
    });
  } catch (err) {
    console.error("[Auth][ResetPassword] Hata:", err);
    return res
      .status(err.statusCode || 500)
      .json({ message: err.message || "Sifre guncellenemedi." });
  }
};
