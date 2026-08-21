const HeroVideo = require("../models/HeroVideo");
const { MediaError } = require("../services/media/errors");
const {
  legacyAssetUrl,
  publicAsset,
  removeOwnerMediaReferences,
  requireReadyAssets,
  syncOwnerMediaReferences,
} = require("../services/media/assets");

function serializeHero(item) {
  const value = typeof item?.toObject === "function" ? item.toObject() : { ...item };
  if (value.mediaAsset && typeof value.mediaAsset === "object") {
    value.url = legacyAssetUrl(value.mediaAsset, "detail");
    value.media = publicAsset(value.mediaAsset, "detail");
    value.mediaAssetId = String(value.mediaAsset._id);
  }
  return value;
}

exports.uploadVideo = async (req, res) => {
  try {
    if ((await HeroVideo.countDocuments()) >= 3) {
      return res.status(409).json({ message: "En fazla 3 hero medyası ekleyebilirsiniz." });
    }
    const [asset] = await requireReadyAssets(req.body.mediaAssetId, {
      purposes: ["hero_image", "hero_video"],
      min: 1,
      max: 1,
    });
    const item = await HeroVideo.create({
      mediaAsset: asset._id,
      url: legacyAssetUrl(asset, "detail"),
      kind: asset.kind,
    });
    await syncOwnerMediaReferences({
      ownerType: "HeroVideo",
      ownerId: item._id,
      fields: { media: [asset._id] },
    });
    const populated = await HeroVideo.findById(item._id).populate("mediaAsset");
    res.status(201).json(serializeHero(populated));
  } catch (error) {
    if (error instanceof MediaError) throw error;
    console.error("Hero media create error:", error);
    res.status(500).json({ message: "Hero medyası eklenemedi." });
  }
};

exports.getHeroVideos = async (_req, res) => {
  try {
    const items = await HeroVideo.find()
      .populate("mediaAsset")
      .sort({ createdAt: -1 });
    res.json(items.map(serializeHero));
  } catch (error) {
    console.error("Hero media list error:", error);
    res.status(500).json({ message: "Hero medyaları getirilemedi." });
  }
};

exports.deleteHeroVideo = async (req, res) => {
  try {
    const deleted = await HeroVideo.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Kayıt bulunamadı." });
    await removeOwnerMediaReferences("HeroVideo", deleted._id);
    res.json({ message: "Hero medyası silindi." });
  } catch (error) {
    console.error("Hero media delete error:", error);
    res.status(500).json({ message: "Hero medyası silinemedi." });
  }
};
