// backend/models/HeroVideo.js
const mongoose = require("mongoose");

const HeroVideoSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("HeroVideo", HeroVideoSchema);
