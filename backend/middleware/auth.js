// backend/middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function resolveTokenUser(token) {
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(payload.userId).select("role tokenVersion");
  if (!user) {
    const err = new Error("Kullanici bulunamadi");
    err.status = 401;
    throw err;
  }

  const payloadTokenVersion = Number(payload?.tokenVersion || 0);
  const currentTokenVersion = Number(user?.tokenVersion || 0);

  if (payloadTokenVersion !== currentTokenVersion) {
    const err = new Error("Oturum gecerliligini yitirdi");
    err.status = 401;
    throw err;
  }

  return { userId: String(user._id), role: user.role };
}

exports.verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token bulunamadı" });
  }

  const token = authHeader.split(" ")[1];
  try {
    req.user = await resolveTokenUser(token);
    next();
  } catch (err) {
    if (err?.status === 401) {
      return res.status(401).json({ message: err.message });
    }
    return res
      .status(403)
      .json({ message: "Token geçersiz veya süresi dolmuş" });
  }
};

exports.attachUserIfPresent = async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.split(" ")[1];
  try {
    req.user = await resolveTokenUser(token);
  } catch {
    // Public endpointlerde hatalı token yüzünden isteği bloklamıyoruz.
  }
  return next();
};
