// backend/models/Product.js
const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    video: { type: String, required: true }, // Ürün hover video URL’si
    images: [{ type: String, required: true }], // 1–4 arası resim URL’leri
    price: { type: Number, required: true }, // İndirimli fiyat
    originalPrice: { type: Number, required: true }, // Normal fiyat
    discount: { type: Number, default: 0 }, // Yüzdelik indirim
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    stock: { type: Number, default: 0 },
    sizes: [{ type: String }], // null olabilir
    description: { type: String, default: "" },
    color: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", ProductSchema);
