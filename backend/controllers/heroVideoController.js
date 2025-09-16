// backend/controllers/heroVideoController.js
const HeroVideo = require("../models/HeroVideo");

// Create new video (upload)
exports.uploadVideo = async (req, res) => {
  try {
    if (!req.file?.path) {
      return res.status(400).json({ message: "Video dosyası gerekli." });
    }

    // 3'ten fazla videoya izin verme
    const count = await HeroVideo.countDocuments();
    if (count >= 3) {
      return res
        .status(400)
        .json({ message: "En fazla 3 hero videosu yükleyebilirsiniz." });
    }

    const video = await HeroVideo.create({ url: req.file.path });
    res.status(201).json(video);
  } catch (err) {
    console.error("Hero video yükleme hatası:", err);
    res.status(500).json({ message: "Sunucu hatası." });
  }
};

// Get all videos
exports.getHeroVideos = async (req, res) => {
  try {
    const videos = await HeroVideo.find().sort({ createdAt: -1 });
    res.json(videos);
  } catch (err) {
    console.error("Hero video listeleme hatası:", err);
    res.status(500).json({ message: "Sunucu hatası." });
  }
};

// Delete video
exports.deleteHeroVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await HeroVideo.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Video bulunamadı." });
    }
    res.json({ message: "Video silindi." });
  } catch (err) {
    console.error("Hero video silme hatası:", err);
    res.status(500).json({ message: "Sunucu hatası." });
  }
};
