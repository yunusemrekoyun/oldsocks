const AnnouncementBar = require("../models/AnnouncementBar");

/* ─────────────────────────────
 * Public: aktif bar (enabled=true)
 * ───────────────────────────── */
exports.getPublicBar = async (req, res) => {
  try {
    const bar =
      (await AnnouncementBar.findOne({ enabled: true })
        .sort("-updatedAt")
        .lean()) || null;
    res.json(bar); // yoksa null döner
  } catch (e) {
    console.error("[AnnouncementBar][public] error:", e);
    res.status(500).json({ message: "Duyuru alınamadı." });
  }
};

/* ─────────────────────────────
 * Admin: mevcut tek kaydı getir
 * (yoksa null döner; frontend ilk kez doldurur)
 * ───────────────────────────── */
exports.getAdminBar = async (req, res) => {
  try {
    const bar = await AnnouncementBar.findOne().sort("-updatedAt").lean();
    res.json(bar || null);
  } catch (e) {
    console.error("[AnnouncementBar][admin-get] error:", e);
    res.status(500).json({ message: "Duyuru alınamadı." });
  }
};

/* ─────────────────────────────
 * Admin: oluştur/güncelle (upsert)
 * Tek kayıt felsefesi: findOneAndUpdate({}, …, upsert:true)
 * ───────────────────────────── */
exports.upsertBar = async (req, res) => {
  try {
    const { text, enabled, bgColor, textColor } = req.body;

    if (!text || !String(text).trim()) {
      return res.status(400).json({ message: "Metin (text) zorunludur." });
    }

    const update = {
      text: String(text).trim(),
    };

    if (typeof enabled === "boolean") update.enabled = enabled;
    if (bgColor !== undefined) update.bgColor = String(bgColor).trim();
    if (textColor !== undefined) update.textColor = String(textColor).trim();

    const bar = await AnnouncementBar.findOneAndUpdate({}, update, {
      new: true,
      upsert: true, // yoksa oluştur
      setDefaultsOnInsert: true,
    });

    res.json(bar);
  } catch (e) {
    console.error("[AnnouncementBar][upsert] error:", e);
    res.status(500).json({ message: "Duyuru kaydedilemedi." });
  }
};

/* ─────────────────────────────
 * Admin: tamamen kaldır (opsiyonel)
 * ───────────────────────────── */
exports.deleteBar = async (req, res) => {
  try {
    await AnnouncementBar.deleteMany({});
    res.json({ message: "Duyuru kaldırıldı." });
  } catch (e) {
    console.error("[AnnouncementBar][delete] error:", e);
    res.status(500).json({ message: "Duyuru silinemedi." });
  }
};
