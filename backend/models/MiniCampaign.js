///Applications/Works/oldsocks main/oldsocks/backend/models/MiniCampaign.js
const mongoose = require("mongoose");

const MiniCampaignSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    imageUrl: { type: String, required: true },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
    slot: {
      type: Number,
      required: true,
      enum: [1, 2],
      unique: true, // her slot yalnızca 1 kere atanabilir
    },
  },
  { timestamps: true }
);

// isActiveSlot1 / isActiveSlot2 sanal alanları da ekleyebilirsiniz:
MiniCampaignSchema.virtual("isActiveSlot1").get(function () {
  return this.slot === 1;
});
MiniCampaignSchema.virtual("isActiveSlot2").get(function () {
  return this.slot === 2;
});

module.exports = mongoose.model("MiniCampaign", MiniCampaignSchema);
