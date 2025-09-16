// backend/models/Order.js
const mongoose = require("mongoose");

const OrderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Types.ObjectId, ref: "Product", required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  qty: { type: Number, required: true },
  size: { type: String },
  color: { type: String },
});

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },

    user: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    items: { type: [OrderItemSchema], required: true },
    totalPrice: { type: Number, required: true },

    address: {
      title: { type: String, required: true },
      mainaddress: { type: String, required: true },
      street: { type: String, required: true },
      district: { type: String },
      city: { type: String, required: true },
      postalCode: { type: String },
    },

    paymentId: { type: String }, // PayTR'de "payment_id" zorunlu değil, opsiyonel
    conversationId: { type: String, required: true, unique: true }, // == merchant_oid
    status: {
      type: String,
      enum: ["pending", "paid", "shipped", "completed", "cancelled"],
      default: "pending",
    },
    stockUpdated: { type: Boolean, default: false },
    adminSeenAt: { type: Date, default: null },

    // ── YENİ: PayTR için hazırlanan pre-init veri (get-token için)
    paytrInit: { type: Object, default: null },

    // ── eski Iyzico alanı bırakılabilir (read-only)
    iyzInit: { type: Object, default: null },
  },
  { timestamps: true }
);

OrderSchema.index({ status: 1, adminSeenAt: 1, createdAt: -1 });
module.exports = mongoose.model("Order", OrderSchema);
