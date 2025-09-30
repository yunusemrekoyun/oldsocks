const mongoose = require("mongoose");

const SizeSchema = new mongoose.Schema({
  /** Beden opsiyonel; boş string = “bedensiz” */
  size: { type: String, default: "" },
  stock: { type: Number, required: true, default: 0 },
});

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    video: { type: String, default: "" },
    images: [{ type: String, required: true }],
    price: { type: Number, required: true },
    originalPrice: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    /** 🔑 Renk artık opsiyonel */
    color: { type: String, default: "" },
    sizes: [SizeSchema], // bedenler (boş da olabilir)
    description: { type: String, default: "" },
    /** Varyant ilişkisi */
    parentProductId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", ProductSchema);
