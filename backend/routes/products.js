const router = require("express").Router();
const { verifyToken } = require("../middleware/auth");
const { allowRoles } = require("../middleware/roles");
const productCtrl = require("../controllers/productController");
const { uploadProductFiles } = require("../middleware/upload");

// Public
router.get("/", productCtrl.getProducts);
router.get("/:id", productCtrl.getProduct);

// Admin-only
router.post(
  "/",
  verifyToken,
  allowRoles("admin"),
  uploadProductFiles.fields([
    { name: "video", maxCount: 1 },
    { name: "images", maxCount: 4 },
  ]),
  productCtrl.createProduct
);

router.put(
  "/:id",
  verifyToken,
  allowRoles("admin"),
  uploadProductFiles.fields([
    { name: "video", maxCount: 1 },
    { name: "images", maxCount: 4 },
  ]),
  productCtrl.updateProduct
);

router.delete(
  "/:id",
  verifyToken,
  allowRoles("admin"),
  productCtrl.deleteProduct
);

module.exports = router;
