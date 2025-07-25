// backend/controllers/blogController.js
const Blog = require("../models/Blog");
const BlogCategory = require("../models/BlogCategory");
const BlogComment = require("../models/BlogComment");
const BlogCommentReply = require("../models/BlogCommentReply");

// Helper to parse JSON-array fields
function parseArrayField(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// — Admin CRUD —

// Create a new blog post
exports.createBlog = async (req, res) => {
  try {
    const { title, subtitle, excerpt, content, status = "draft" } = req.body;
    const categories = parseArrayField(req.body.categories);
    const tags = parseArrayField(req.body.tags);

    // required
    if (!title || !content || !req.file) {
      return res.status(400).json({
        message: "title, content ve coverImage (file) zorunludur.",
      });
    }

    // category validation
    for (let cid of categories) {
      if (!(await BlogCategory.exists({ _id: cid }))) {
        return res.status(400).json({ message: `Invalid category ID: ${cid}` });
      }
    }

    const blog = await Blog.create({
      title,
      subtitle,
      excerpt,
      content,
      coverImageUrl: req.file.path,
      author: req.body.author || req.user.id, // admin user ID
      categories,
      tags,
      status,
      publishedAt: status === "published" ? new Date() : undefined,
    });

    res.status(201).json(blog);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Error creating blog.", error: err.message });
  }
};

// Read all
exports.getBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find()
      .populate("author", "firstName lastName email")
      .populate("categories", "name slug")
      .select("-content")
      .sort({ createdAt: -1 });
    res.json(blogs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching blogs." });
  }
};

// Read single
exports.getBlog = async (req, res) => {
  try {
    const query = /^[0-9a-fA-F]{24}$/.test(req.params.slugOrId)
      ? { _id: req.params.slugOrId }
      : { slug: req.params.slugOrId };

    const blog = await Blog.findOne(query)
      .populate("author", "firstName lastName email avatarUrl")
      .populate("categories", "name slug")
      .populate({
        path: "comments",
        populate: [
          { path: "author", select: "firstName lastName avatarUrl" },
          {
            path: "replies",
            populate: {
              path: "author",
              select: "firstName lastName avatarUrl",
            },
          },
        ],
      });

    if (!blog) return res.status(404).json({ message: "Blog not found." });
    res.json(blog);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching blog." });
  }
};

// Update
exports.updateBlog = async (req, res) => {
  try {
    const { title, subtitle, excerpt, content, status } = req.body;
    const categories = parseArrayField(req.body.categories);
    const tags = parseArrayField(req.body.tags);

    if (!title || !content) {
      return res.status(400).json({ message: "title ve content zorunludur." });
    }

    // category validation
    for (let cid of categories) {
      if (!(await BlogCategory.exists({ _id: cid }))) {
        return res.status(400).json({ message: `Invalid category ID: ${cid}` });
      }
    }

    const updates = { title, subtitle, excerpt, content, categories, tags };
    if (req.file) updates.coverImageUrl = req.file.path;
    if (status) {
      updates.status = status;
      if (status === "published" && !req.body.publishedAt) {
        updates.publishedAt = new Date();
      }
    }

    const updated = await Blog.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    });
    if (!updated) return res.status(404).json({ message: "Blog not found." });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating blog." });
  }
};

// Delete
exports.deleteBlog = async (req, res) => {
  try {
    const deleted = await Blog.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Blog not found." });

    // isteğe bağlı: yorum + reply temizle
    await BlogComment.deleteMany({ blog: req.params.id });
    await BlogCommentReply.deleteMany({ comment: { $in: deleted.comments } });

    res.json({ message: "Blog deleted." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting blog." });
  }
};
