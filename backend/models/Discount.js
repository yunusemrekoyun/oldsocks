const mongoose = require("mongoose");

const AppliedSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    previousDiscount: { type: Number, default: 0 },
  },
  { _id: false }
);

const DiscountSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    discountRate: { type: Number, required: true, min: 0, max: 100 },
    // "product" | "category" | "subcategory"
    selectionType: {
      type: String,
      enum: ["product", "category", "subcategory"],
      required: true,
    },
    targetIds: [{ type: mongoose.Schema.Types.ObjectId, required: true }],
    isActive: { type: Boolean, default: false },
    appliedProducts: [AppliedSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Discount", DiscountSchema);
