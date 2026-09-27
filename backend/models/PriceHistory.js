const mongoose = require("mongoose");

// Ürün fiyat geçmişi. İndirim duyurusunda "önceki fiyat" son 30 günün en düşük
// fiyatı olmalıdır (Haksız Ticari Uygulamalar Yönetmeliği); bu kayıtlar onu hesaplar.
const PriceHistorySchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, default: null, min: 0 },
    source: {
      type: String,
      enum: ["initial", "create", "update", "discount", "discount_revert", "restore"],
      required: true,
    },
    at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

PriceHistorySchema.index({ product: 1, at: -1 });

module.exports = mongoose.model("PriceHistory", PriceHistorySchema);
