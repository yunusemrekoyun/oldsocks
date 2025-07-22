// backend/models/Order.js
const mongoose = require("mongoose");

const OrderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Types.ObjectId, ref: "Product", required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  qty: { type: Number, required: true },
});

const OrderSchema = new mongoose.Schema(
  {
    // ★ 10 haneli, benzersiz bir sipariş numarası:
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

    // paymentId artık “pending” aşamasında boş olabilir
    paymentId: { type: String },

    conversationId: { type: String, required: true, unique: true },

    status: {
      type: String,
      enum: ["pending", "paid", "shipped", "completed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", OrderSchema);
