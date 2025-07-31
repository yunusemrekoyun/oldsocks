///Applications/Works/oldsocks main/oldsocks/backend/models/Product.js
const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    video: {
      type: String,
      required: true, // hover video URL
    },
    images: [
      {
        type: String,
        required: true, // 1–4 image URLs
      },
    ],
    price: {
      type: Number,
      required: true, // indirimli fiyat
    },
    originalPrice: {
      type: Number,
      required: true, // normal fiyat
    },
    discount: {
      type: Number,
      default: 0, // yüzde indirim
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true, // alt veya üst kategori ID’si
    },
    stock: {
      type: Number,
      default: 0,
    },
    sizes: [
      {
        type: String,
      },
    ],
    description: {
      type: String,
      default: "",
    },
    color: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", ProductSchema);
