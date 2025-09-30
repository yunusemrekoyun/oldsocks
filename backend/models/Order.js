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

const GuestSchema = new mongoose.Schema(
  {
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    identityNumber: { type: String, trim: true },
    registrationAddress: { type: String, trim: true },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },

    // Kayıtlı kullanıcı varsa doldurulur:
    user: { type: mongoose.Types.ObjectId, ref: "User", required: false },

    // Guest checkout bilgileri (opsiyonel — user yoksa guest dolu olmalı)
    guest: { type: GuestSchema, default: null },

    items: { type: [OrderItemSchema], required: true },
    totalPrice: { type: Number, required: true },
    orderMailSentAt: { type: Date, default: null },
    address: {
      title: { type: String, required: true },
      mainaddress: { type: String, required: true },
      street: { type: String, required: true },
      district: { type: String },
      city: { type: String, required: true },
      postalCode: { type: String },
    },

    paymentId: { type: String },
    conversationId: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ["pending", "paid", "shipped", "completed", "cancelled"],
      default: "pending",
    },
    stockUpdated: { type: Boolean, default: false },
    adminSeenAt: { type: Date, default: null },

    paytrInit: { type: Object, default: null },
    iyzInit: { type: Object, default: null },
  },
  { timestamps: true }
);

// En azından user veya guest birinden biri dolu olsun
OrderSchema.pre("validate", function (next) {
  if (!this.user && !this.guest) {
    return next(new Error("Order must have either a user or guest info."));
  }
  next();
});

OrderSchema.index({ status: 1, adminSeenAt: 1, createdAt: -1 });
module.exports = mongoose.model("Order", OrderSchema);
