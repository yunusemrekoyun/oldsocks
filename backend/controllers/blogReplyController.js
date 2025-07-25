const BlogCommentReply = require("../models/BlogCommentReply");

// Admin: tüm yanıtları listele (approved filtresiyle)
exports.getAllReplies = async (req, res) => {
  try {
    const approved = req.query.approved === "true";
    const replies = await BlogCommentReply.find({ approved })
      .populate("author", "firstName lastName avatar")
      .populate({
        path: "comment",
        select: "blog",
        populate: { path: "blog", select: "title slug" },
      })
      .sort({ createdAt: -1 });
    res.json(replies);
  } catch (err) {
    console.error("🔥 getAllReplies error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Admin: tek bir yanıtı getir
exports.getReply = async (req, res) => {
  try {
    const reply = await BlogCommentReply.findById(req.params.id);
    if (!reply) return res.status(404).json({ message: "Yanıt bulunamadı." });
    res.json(reply);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Yanıt alınırken hata oluştu." });
  }
};

// Admin: yanıtı onayla
exports.approveReply = async (req, res) => {
  try {
    const reply = await BlogCommentReply.findByIdAndUpdate(
      req.params.id,
      { approved: true },
      { new: true }
    );
    if (!reply) return res.status(404).json({ message: "Yanıt bulunamadı." });
    res.json(reply);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Yanıt onaylanırken hata oluştu." });
  }
};

// Public: bir yorumun onaylı yanıtlarını getir
exports.getRepliesByComment = async (req, res) => {
  try {
    const replies = await BlogCommentReply.find({
      comment: req.params.commentId,
      approved: true,
    })
      .populate("author", "firstName lastName avatar")
      .sort({ createdAt: -1 });
    res.json(replies);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Yanıtlar alınırken hata oluştu." });
  }
};

// Logged-in user: yeni yanıt ekle (onayda)
exports.createReply = async (req, res) => {
  try {
    const reply = await BlogCommentReply.create({
      comment: req.params.commentId,
      author: req.user.userId,
      text: req.body.text,
    });
    res.status(201).json(reply);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Yanıt oluşturulurken hata oluştu." });
  }
};

// Silme: sahibi veya admin
exports.deleteReply = async (req, res) => {
  try {
    const reply = await BlogCommentReply.findById(req.params.id);
    if (!reply) return res.status(404).json({ message: "Yanıt bulunamadı." });
    if (
      reply.author.toString() !== req.user.userId &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Bu yanıtı silemezsiniz." });
    }
    await BlogCommentReply.findByIdAndDelete(req.params.id);
    res.json({ message: "Yanıt silindi." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Yanıt silinirken hata oluştu." });
  }
};
