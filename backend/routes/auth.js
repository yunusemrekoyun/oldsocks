// backend/routes/auth.js
const express = require("express");
const router = express.Router();
const {
  register,
  login,
  refresh,
  logout,
} = require("../controllers/authController");

// POST /api/v1/auth/register
router.post("/register", register);

// POST /api/v1/auth/login
router.post("/login", login);

// POST /api/v1/auth/refresh
router.post("/refresh", refresh);

// POST /api/v1/auth/logout
router.post("/logout", logout);

module.exports = router;