const mongoose = require("mongoose");
const { Schema } = mongoose;

const UserProfilePictureSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    url: { type: String, required: true },
    publicId: { type: String, required: true }, // cloudinary’den dönen public_id
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserProfilePicture", UserProfilePictureSchema);
