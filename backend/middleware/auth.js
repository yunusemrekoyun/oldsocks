// backend/middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token bulunamadı" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.userId).select("role tokenVersion");
    if (!user) {
      return res.status(401).json({ message: "Kullanici bulunamadi" });
    }

    const payloadTokenVersion = Number(payload?.tokenVersion || 0);
    const currentTokenVersion = Number(user?.tokenVersion || 0);

    if (payloadTokenVersion !== currentTokenVersion) {
      return res.status(401).json({ message: "Oturum gecerliligini yitirdi" });
    }

    req.user = { userId: String(user._id), role: user.role };
    next();
  } catch (err) {
    return res
      .status(403)
      .json({ message: "Token geçersiz veya süresi dolmuş" });
  }
};
