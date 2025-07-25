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

    if (!title || !content || !req.file) {
      return res.status(400).json({
        message: "title, content ve coverImage (file) zorunludur.",
      });
    }

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

// Read all blogs (public)
exports.getBlogs = async (req, res) => {
  try {
    // 1) Tüm blogları çek, author.avatar ile
    const blogs = await Blog.find()
      .populate("author", "firstName lastName avatar bio")
      .populate("categories", "name slug")
      .select("-content")
      .sort({ createdAt: -1 });

    // 2) Approved yorum sayılarını aggregation ile grupla
    const blogIds = blogs.map((b) => b._id);
    const counts = await BlogComment.aggregate([
      { $match: { blog: { $in: blogIds }, approved: true } },
      { $group: { _id: "$blog", count: { $sum: 1 } } },
    ]);
    const countMap = {};
    counts.forEach((c) => {
      countMap[c._id.toString()] = c.count;
    });

    // 3) Sonuca commentsCount ekle
    const result = blogs.map((b) => {
      const obj = b.toObject();
      obj.commentsCount = countMap[b._id.toString()] || 0;
      return obj;
    });

    return res.json(result);
  } catch (err) {
    console.error("Error fetching blogs:", err);
    return res.status(500).json({ message: "Error fetching blogs." });
  }
};

// Read single blog (public)
exports.getBlog = async (req, res) => {
  try {
    // slug veya _id ile bulunabilir
    const query = /^[0-9a-fA-F]{24}$/.test(req.params.slugOrId)
      ? { _id: req.params.slugOrId }
      : { slug: req.params.slugOrId };

    const blog = await Blog.findOne(query)
      // author'ı avatar ile birlikte çek
      .populate("author", "firstName lastName avatar bio email")
      .populate("categories", "name slug")
      .populate("tags", "name");

    if (!blog) return res.status(404).json({ message: "Blog not found." });
    res.json(blog);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching blog." });
  }
};

// Update existing blog (admin)
exports.updateBlog = async (req, res) => {
  try {
    const { title, subtitle, excerpt, content, status } = req.body;
    const categories = parseArrayField(req.body.categories);
    const tags = parseArrayField(req.body.tags);

    if (!title || !content) {
      return res.status(400).json({ message: "title ve content zorunludur." });
    }

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

// Delete blog (admin)
exports.deleteBlog = async (req, res) => {
  try {
    const deleted = await Blog.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Blog not found." });

    // İlgili yorum ve yanıtları temizle
    await BlogComment.deleteMany({ blog: req.params.id });
    await BlogCommentReply.deleteMany({ comment: { $in: deleted.comments } });

    res.json({ message: "Blog deleted." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting blog." });
  }
};
