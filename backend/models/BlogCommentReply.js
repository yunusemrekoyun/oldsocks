const mongoose = require("mongoose");
const { Schema } = mongoose;

const BlogCommentReplySchema = new Schema(
  {
    comment: {
      type: Schema.Types.ObjectId,
      ref: "BlogComment",
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: { type: String, required: true, trim: true },
    approved: { type: Boolean, default: false }, // ← eklendi
  },
  { timestamps: true }
);

module.exports = mongoose.model("BlogCommentReply", BlogCommentReplySchema);
