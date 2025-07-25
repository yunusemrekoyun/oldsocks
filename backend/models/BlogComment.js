const mongoose = require("mongoose");
const { Schema } = mongoose;

const BlogCommentSchema = new Schema(
  {
    blog: {
      type: Schema.Types.ObjectId,
      ref: "Blog",
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: { type: String, required: true, trim: true },
    replies: [
      {
        type: Schema.Types.ObjectId,
        ref: "BlogCommentReply",
      },
    ],
    approved: { type: Boolean, default: false }, // ← eklendi
  },
  { timestamps: true }
);

module.exports = mongoose.model("BlogComment", BlogCommentSchema);
