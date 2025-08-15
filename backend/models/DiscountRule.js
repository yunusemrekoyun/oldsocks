// backend/models/DiscountRule.js
const mongoose = require("mongoose");

const DiscountRuleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },

    // 'product' | 'category' | 'subcategory'
    selectionType: {
      type: String,
      enum: ["product", "category", "subcategory"],
      required: true,
    },

    // hedef ID’leri (ürün/kategori/alt kategori). ObjectId tutuyoruz.
    targetIds: [{ type: mongoose.Schema.Types.ObjectId, required: true }],

    // yüzde indirim (0-100 arası)
    discountRate: { type: Number, min: 0, max: 100, required: true },

    // true ise ürünün kendi discount’unu ezer
    overrideExisting: { type: Boolean, default: true },

    // tarih aralığı opsiyonel
    startAt: { type: Date, default: null },
    endAt: { type: Date, default: null },

    // listeyi kolay yönetmek için
    isActive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DiscountRule", DiscountRuleSchema);