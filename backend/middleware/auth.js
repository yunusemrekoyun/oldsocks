// backend/middleware/auth.js
const jwt = require("jsonwebtoken");

exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token bulunamadı" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // payload içinde { userId, role, iat, exp }
    req.user = { userId: payload.userId, role: payload.role };
    next();
  } catch (err) {
    return res
      .status(403)
      .json({ message: "Token geçersiz veya süresi dolmuş" });
  }
};
