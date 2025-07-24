// backend/models/Campaign.js
const mongoose = require("mongoose");

const CampaignSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, required: true, trim: true },
    buttonText: { type: String, required: true, trim: true },
    imageUrl: { type: String, required: true },
    products: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Product" }
    ],
    categories: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Category" }
    ],
    isActive: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Campaign", CampaignSchema);