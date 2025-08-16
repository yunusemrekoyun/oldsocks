const router = require("express").Router();
const { subscribe, list } = require("../controllers/newsletterController");
const { verifyToken } = require("../middleware/auth");
const { allowRoles } = require("../middleware/roles");

// public: abone ol
router.post("/subscribe", subscribe);

// admin: listele (opsiyonel)
router.get("/", verifyToken, allowRoles("admin"), list);

module.exports = router;
