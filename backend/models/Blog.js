const mongoose = require("mongoose");
const { Schema } = mongoose;

const BlogSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true },
    excerpt: { type: String, trim: true },
    content: { type: String, required: true }, // Markdown veya HTML
    coverImageUrl: { type: String, required: true },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    categories: [
      {
        type: Schema.Types.ObjectId,
        ref: "BlogCategory",
      },
    ],
    tags: [{ type: String, trim: true }],
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: "BlogComment",
      },
    ],
    slug: { type: String, required: true, trim: true, unique: true },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

// İsteğe bağlı: otomatik slug üretme
BlogSchema.pre("validate", function (next) {
  if (this.isModified("title") && this.title) {
    this.slug = this.title
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, "-");
  }
  next();
});

module.exports = mongoose.model("Blog", BlogSchema);
