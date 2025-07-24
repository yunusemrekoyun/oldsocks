// backend/routes/campaign.js
const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const { allowRoles } = require("../middleware/roles");
const ctrl = require("../controllers/campaignController");
const { uploadCampaignImage } = require("../middleware/upload");

// Public
router.get("/", ctrl.getCampaigns);
router.get("/active", ctrl.getActiveCampaign);
router.get("/:id", ctrl.getCampaign);

// Admin
router.post(
  "/",
  verifyToken,
  allowRoles("admin"),
  uploadCampaignImage.single("image"), // <-- upload burada
  ctrl.createCampaign
);
router.put(
  "/:id",
  verifyToken,
  allowRoles("admin"),
  uploadCampaignImage.single("image"), // <-- upload burada
  ctrl.updateCampaign
);
router.delete("/:id", verifyToken, allowRoles("admin"), ctrl.deleteCampaign);
router.patch(
  "/:id/activate",
  verifyToken,
  allowRoles("admin"),
  ctrl.setActiveCampaign
);

module.exports = router;
