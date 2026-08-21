const MiniCampaign = require("../models/MiniCampaign");
const Product = require("../models/Product");
const Category = require("../models/Category");
const { MediaError } = require("../services/media/errors");
const {
  applyProductMedia,
  legacyAssetUrl,
  publicAsset,
  removeOwnerMediaReferences,
  requireReadyAssets,
  syncOwnerMediaReferences,
} = require("../services/media/assets");

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

function parseSlot(raw) {
  const slot = Number(raw);
  return [1, 2].includes(slot) ? slot : null;
}

async function validateTargets(products, categories) {
  const [productCount, categoryCount] = await Promise.all([
    Product.countDocuments({ _id: { $in: products } }),
    Category.countDocuments({ _id: { $in: categories } }),
  ]);
  if (productCount !== new Set(products.map(String)).size) {
    const error = new Error("Geçersiz ürün seçimi.");
    error.statusCode = 400;
    throw error;
  }
  if (categoryCount !== new Set(categories.map(String)).size) {
    const error = new Error("Geçersiz kategori seçimi.");
    error.statusCode = 400;
    throw error;
  }
}

function miniQuery(query) {
  return query
    .populate("imageAsset")
    .populate({
      path: "products",
      select: "name images imageAssets video videoAsset price originalPrice discount",
      populate: [{ path: "imageAssets" }, { path: "videoAsset" }],
    })
    .populate("categories", "name image imageAsset");
}

function serializeMini(campaign, context = "list") {
  const value = typeof campaign?.toObject === "function" ? campaign.toObject() : { ...campaign };
  if (value.imageAsset && typeof value.imageAsset === "object") {
    value.imageUrl = legacyAssetUrl(value.imageAsset, context);
    value.media = publicAsset(value.imageAsset, context);
    value.imageAssetId = String(value.imageAsset._id);
  }
  if (Array.isArray(value.products)) {
    value.products = value.products.map((product) => applyProductMedia(product, "list"));
  }
  return value;
}

async function syncMini(campaign) {
  await syncOwnerMediaReferences({
    ownerType: "MiniCampaign",
    ownerId: campaign._id,
    fields: { image: campaign.imageAsset ? [campaign.imageAsset] : [] },
  });
}

exports.createMiniCampaign = async (req, res) => {
  try {
    const slot = parseSlot(req.body.slot);
    if (!req.body.title || !slot) {
      return res.status(400).json({ message: "Başlık ve 1 veya 2 numaralı slot zorunludur." });
    }
    const products = parseArrayField(req.body.products);
    const categories = parseArrayField(req.body.categories);
    await validateTargets(products, categories);
    const [asset] = await requireReadyAssets(req.body.imageAssetId, {
      purpose: "mini_campaign_image",
      kind: "image",
      min: 1,
      max: 1,
    });
    await MiniCampaign.updateMany({ slot }, { $set: { slot: null } });
    const campaign = await MiniCampaign.create({
      title: req.body.title,
      slot,
      products,
      categories,
      imageAsset: asset._id,
      imageUrl: legacyAssetUrl(asset, "detail"),
    });
    await syncMini(campaign);
    res.status(201).json(serializeMini(await miniQuery(MiniCampaign.findById(campaign._id))));
  } catch (error) {
    if (error instanceof MediaError || error.statusCode) throw error;
    console.error(error);
    res.status(500).json({ message: "Mini kampanya oluşturulamadı." });
  }
};

exports.getMiniCampaigns = async (_req, res) => {
  try {
    const campaigns = await miniQuery(MiniCampaign.find().sort({ slot: 1, createdAt: -1 }));
    res.json(campaigns.map((campaign) => serializeMini(campaign)));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Mini kampanyalar getirilemedi." });
  }
};

exports.getMiniCampaign = async (req, res) => {
  try {
    const campaign = await miniQuery(MiniCampaign.findById(req.params.id));
    if (!campaign) return res.status(404).json({ message: "Mini kampanya bulunamadı." });
    res.json(serializeMini(campaign, "detail"));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Mini kampanya getirilemedi." });
  }
};

exports.updateMiniCampaign = async (req, res) => {
  try {
    const campaign = await MiniCampaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ message: "Mini kampanya bulunamadı." });
    const slot = parseSlot(req.body.slot);
    if (!req.body.title || !slot) {
      return res.status(400).json({ message: "Başlık ve 1 veya 2 numaralı slot zorunludur." });
    }
    const products = parseArrayField(req.body.products);
    const categories = parseArrayField(req.body.categories);
    await validateTargets(products, categories);
    await MiniCampaign.updateMany(
      { slot, _id: { $ne: campaign._id } },
      { $set: { slot: null } }
    );
    campaign.title = req.body.title;
    campaign.slot = slot;
    campaign.products = products;
    campaign.categories = categories;
    if (req.body.imageAssetId !== undefined) {
      const [asset] = await requireReadyAssets(req.body.imageAssetId, {
        purpose: "mini_campaign_image",
        kind: "image",
        min: 1,
        max: 1,
      });
      campaign.imageAsset = asset._id;
      campaign.imageUrl = legacyAssetUrl(asset, "detail");
    }
    await campaign.save();
    await syncMini(campaign);
    res.json(serializeMini(await miniQuery(MiniCampaign.findById(campaign._id))));
  } catch (error) {
    if (error instanceof MediaError || error.statusCode) throw error;
    console.error(error);
    res.status(500).json({ message: "Mini kampanya güncellenemedi." });
  }
};

exports.deleteMiniCampaign = async (req, res) => {
  try {
    const campaign = await MiniCampaign.findByIdAndDelete(req.params.id);
    if (!campaign) return res.status(404).json({ message: "Mini kampanya bulunamadı." });
    await removeOwnerMediaReferences("MiniCampaign", campaign._id);
    res.json({ message: "Mini kampanya silindi." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Mini kampanya silinemedi." });
  }
};

exports.setActiveMiniCampaign = async (req, res) => {
  try {
    const slot = parseSlot(req.query.slot);
    if (!slot) return res.status(400).json({ message: "Slot 1 veya 2 olmalıdır." });
    const campaign = await MiniCampaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ message: "Mini kampanya bulunamadı." });
    await MiniCampaign.updateMany({ slot }, { $set: { slot: null } });
    campaign.slot = slot;
    await campaign.save();
    res.json({ message: `Mini kampanya ${slot}. slota alındı.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Slot güncellenemedi." });
  }
};

exports.getActiveMiniCampaigns = async (req, res) => {
  try {
    const slot = parseSlot(req.query.slot);
    const campaign = await miniQuery(
      MiniCampaign.findOne(slot ? { slot } : { slot: { $in: [1, 2] } }).sort("slot")
    );
    if (!campaign) return res.status(404).json({ message: "Mini kampanya bulunamadı." });
    let items = campaign.products?.map((product) => applyProductMedia(product, "list")) || [];
    if (!items.length && campaign.categories?.length) {
      const subs = await Category.find({ parent: { $in: campaign.categories } }).select("_id");
      const categoryIds = [
        ...campaign.categories.map((category) => category._id || category),
        ...subs.map((category) => category._id),
      ];
      const products = await Product.find({ category: { $in: categoryIds } })
        .select("name images imageAssets video videoAsset price originalPrice discount")
        .populate("imageAssets")
        .populate("videoAsset")
        .lean();
      items = products.map((product) => applyProductMedia(product, "list"));
    }
    res.json({ ...serializeMini(campaign, "detail"), items });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Mini kampanya getirilemedi." });
  }
};
