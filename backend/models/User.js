// backend/models/User.js
const mongoose = require("mongoose");

const AddressSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    street: { type: String, required: true },
    mainaddress: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String },
    postalCode: { type: String },
  },
  { _id: true }
);

const UserSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    phone: { type: String },
    addresses: { type: [AddressSchema], default: [] },
    avatar: { type: String },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    refreshTokens: { type: [String], default: [] },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", UserSchema);
