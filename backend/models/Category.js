// backend/models/Category.js
const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      required: true,
    }, // multer ile yüklenip URL saklanacak
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    }, // alt kategori ise parent gösterir, yoksa null
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Category", CategorySchema);
