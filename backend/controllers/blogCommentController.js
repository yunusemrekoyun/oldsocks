// backend/controllers/blogCommentController.js
const BlogComment = require("../models/BlogComment");

// Admin: tüm yorumları listele (approved filtresiyle)
exports.getAllComments = async (req, res) => {
  try {
    const approved = req.query.approved === "true";
    const comments = await BlogComment.find({ approved })
      .populate("author", "firstName lastName avatar")
      .populate("blog", "title slug")
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    console.error("🔥 getAllComments error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Admin: tek bir yorumu getir (populate eklendi)
exports.getComment = async (req, res) => {
  try {
    const comment = await BlogComment.findById(req.params.id)
      .populate("author", "firstName lastName avatar")
      .populate("blog", "title slug");
    if (!comment) return res.status(404).json({ message: "Yorum bulunamadı." });
    res.json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Yorum alınırken hata oluştu." });
  }
};

// Admin: yorumu onayla
exports.approveComment = async (req, res) => {
  try {
    const comment = await BlogComment.findByIdAndUpdate(
      req.params.id,
      { approved: true },
      { new: true }
    );
    if (!comment) return res.status(404).json({ message: "Yorum bulunamadı." });
    res.json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Yorum onaylanırken hata oluştu." });
  }
};

// Public: bir blogun sadece onaylı yorumlarını getir
exports.getCommentsByBlog = async (req, res) => {
  try {
    const comments = await BlogComment.find({
      blog: req.params.blogId,
      approved: true,
    })
      .populate("author", "firstName lastName avatar")
      .populate({
        path: "replies",
        match: { approved: true },
        populate: { path: "author", select: "firstName lastName avatar" },
      })
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Yorumlar alınırken hata oluştu." });
  }
};

// Logged-in user: yeni yorum ekle (onayda)
exports.createComment = async (req, res) => {
  try {
    const comment = await BlogComment.create({
      blog: req.params.blogId,
      author: req.user.userId,
      text: req.body.text,
      // approved: false (default)
    });
    res.status(201).json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Yorum oluşturulurken hata oluştu." });
  }
};

// Silme: sahibi veya admin
exports.deleteComment = async (req, res) => {
  try {
    const comment = await BlogComment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: "Yorum bulunamadı." });

    if (
      comment.author.toString() !== req.user.userId &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Bu yorumu silemezsiniz." });
    }

    await BlogComment.findByIdAndDelete(req.params.id);
    res.json({ message: "Yorum silindi." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Yorum silinirken hata oluştu." });
  }
};
