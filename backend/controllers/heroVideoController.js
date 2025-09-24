const HeroVideo = require("../models/HeroVideo");

// Create new media (upload)
exports.uploadVideo = async (req, res) => {
  try {
    const file = req.file;
    if (!file?.path) {
      return res.status(400).json({ message: "Dosya yüklenmedi." });
    }

    // 3'ten fazla öğeye izin verme
    const count = await HeroVideo.countDocuments();
    if (count >= 3) {
      return res
        .status(400)
        .json({ message: "En fazla 3 hero medyası yükleyebilirsiniz." });
    }

    // türü tespit et
    const mime = file.mimetype || "";
    const isImage = mime.startsWith("image/");
    const isVideo = mime.startsWith("video/");

    if (!isImage && !isVideo) {
      return res
        .status(400)
        .json({ message: "Sadece video veya görsel yükleyebilirsiniz." });
    }

    const media = await HeroVideo.create({
      url: file.path,
      kind: isImage ? "image" : "video",
    });

    res.status(201).json(media);
  } catch (err) {
    console.error("Hero media upload error:", err);
    res.status(500).json({ message: "Sunucu hatası." });
  }
};

// Get all media
exports.getHeroVideos = async (req, res) => {
  try {
    const items = await HeroVideo.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error("Hero media list error:", err);
    res.status(500).json({ message: "Sunucu hatası." });
  }
};

// Delete media
exports.deleteHeroVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await HeroVideo.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Kayıt bulunamadı." });
    }
    res.json({ message: "Silindi." });
  } catch (err) {
    console.error("Hero media delete error:", err);
    res.status(500).json({ message: "Sunucu hatası." });
  }
};
