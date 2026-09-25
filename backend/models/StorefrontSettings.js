const mongoose = require("mongoose");

const sectionSchema = new mongoose.Schema({
  heading: { type: String, trim: true, maxlength: 80, required: true },
  source: {
    type: String,
    enum: ["latest", "best_selling", "category", "manual", "random"],
    required: true,
  },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
  productIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  shuffle: { type: Boolean, default: false },
}, { _id: false });

const storefrontSettingsSchema = new mongoose.Schema({
  key: { type: String, default: "main", unique: true, immutable: true },
  fontPreset: { type: String, enum: ["classic", "modern", "fashion"], default: "classic" },
  sections: {
    new: { type: sectionSchema, required: true },
    featured: { type: sectionSchema, required: true },
    popular: { type: sectionSchema, required: true },
  },
}, { timestamps: true });

module.exports = mongoose.model("StorefrontSettings", storefrontSettingsSchema);
