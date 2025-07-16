// backend/routes/categories.js
const router = require("express").Router();
const { verifyToken } = require("../middleware/auth");
const { allowRoles } = require("../middleware/roles");
const ctrl = require("../controllers/categoryController");
const { uploadCategoryImage } = require("../middleware/upload");

// Public
router.get("/", ctrl.getCategories);
router.get("/:id", ctrl.getCategory);

// Admin-only
router.post(
  "/",
  verifyToken,
  allowRoles("admin"),
  uploadCategoryImage.single("image"),
  ctrl.createCategory
);
router.put(
  "/:id",
  verifyToken,
  allowRoles("admin"),
  uploadCategoryImage.single("image"), // 💡 bu satır eklendi
  ctrl.updateCategory
);
router.delete("/:id", verifyToken, allowRoles("admin"), ctrl.deleteCategory);

module.exports = router;
