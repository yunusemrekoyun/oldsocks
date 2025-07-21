// backend/routes/users.js
const router = require("express").Router();
const { verifyToken } = require("../middleware/auth");
const { allowRoles } = require("../middleware/roles");
const {
  getMe,
  updateMe,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require("../controllers/userController");

// — Normal user endpoints —
router.get("/me", verifyToken, getMe); // GET    /api/v1/users/me
router.put("/me", verifyToken, updateMe); // PUT    /api/v1/users/me

// — Address management for logged-in user —
router.get("/me/addresses", verifyToken, getAddresses); // GET    /api/v1/users/me/addresses
router.post("/me/addresses", verifyToken, addAddress); // POST   /api/v1/users/me/addresses
router.put("/me/addresses/:addrId", verifyToken, updateAddress); // PUT    /api/v1/users/me/addresses/:addrId
router.delete("/me/addresses/:addrId", verifyToken, deleteAddress); // DELETE /api/v1/users/me/addresses/:addrId

// — Admin-only endpoints —
router.get("/", verifyToken, allowRoles("admin"), getAllUsers); // GET    /api/v1/users
router.get("/:id", verifyToken, allowRoles("admin"), getUserById); // GET    /api/v1/users/:id
router.put("/:id", verifyToken, allowRoles("admin"), updateUser); // PUT    /api/v1/users/:id
router.delete("/:id", verifyToken, allowRoles("admin"), deleteUser); // DELETE /api/v1/users/:id

module.exports = router;
