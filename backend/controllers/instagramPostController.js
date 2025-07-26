// backend/controllers/instagramPostController.js
const InstagramPost = require("../models/InstagramPost");

// GET all
exports.getAllInstagramPosts = async (req, res) => {
  try {
    const posts = await InstagramPost.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Sunucu hatası", error: err.message });
  }
};

// CREATE with duplicate check
exports.createInstagramPost = async (req, res) => {
  try {
    const { embedLink, caption = "", active = true } = req.body;
    if (!embedLink) {
      return res.status(400).json({ message: "Embed link zorunludur." });
    }

    // Aynı embedLink zaten var mı?
    const existing = await InstagramPost.findOne({ embedLink });
    if (existing) {
      // Hata yerine gayet normal bir yanıt dönüyoruz
      return res
        .status(200)
        .json({ message: "Bu gönderi zaten mevcut.", post: existing });
    }

    const newPost = new InstagramPost({ embedLink, caption, active });
    const saved = await newPost.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("🔥 createInstagramPost error:", err);
    res.status(500).json({ message: "Kaydedilemedi", error: err.message });
  }
};

// UPDATE
exports.updateInstagramPost = async (req, res) => {
  try {
    const updated = await InstagramPost.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Post bulunamadı" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: "Güncellenemedi", error: err.message });
  }
};

// DELETE
exports.deleteInstagramPost = async (req, res) => {
  try {
    const deleted = await InstagramPost.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Post bulunamadı" });
    res.json({ message: "Post silindi" });
  } catch (err) {
    res.status(500).json({ message: "Silinemedi", error: err.message });
  }
};
