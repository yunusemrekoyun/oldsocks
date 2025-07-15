// backend/routes/users.js
const router = require("express").Router();
const { verifyToken } = require("../middleware/auth");
const { allowRoles } = require("../middleware/roles");
const {
  getMe,
  updateMe,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require("../controllers/userController");

// ---- Normal user endpoints ----
// GET  /api/v1/users/me
router.get("/me", verifyToken, getMe);

// PUT  /api/v1/users/me
router.put("/me", verifyToken, updateMe);

// ---- Admin-only endpoints ----
// GET    /api/v1/users
router.get("/", verifyToken, allowRoles("admin"), getAllUsers);

// GET    /api/v1/users/:id
router.get("/:id", verifyToken, allowRoles("admin"), getUserById);

// PUT    /api/v1/users/:id
router.put("/:id", verifyToken, allowRoles("admin"), updateUser);

// DELETE /api/v1/users/:id
router.delete("/:id", verifyToken, allowRoles("admin"), deleteUser);

module.exports = router;
