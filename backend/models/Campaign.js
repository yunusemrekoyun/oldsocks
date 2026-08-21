const mongoose = require("mongoose");

const CampaignSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true, default: "" }, // <-- zorunlu değil
    buttonText: { type: String, required: true, trim: true },
    imageUrl: { type: String, default: "" },
    imageAsset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MediaAsset",
      default: null,
      index: true,
    },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
    isActive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Campaign", CampaignSchema);
