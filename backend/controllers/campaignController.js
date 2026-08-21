const Campaign = require("../models/Campaign");
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

function campaignQuery(query) {
  return query
    .populate("imageAsset")
    .populate({
      path: "products",
      select: "name images imageAssets video videoAsset price",
      populate: [{ path: "imageAssets" }, { path: "videoAsset" }],
    })
    .populate("categories", "name image imageAsset");
}

function serializeCampaign(campaign, context = "list") {
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

async function syncCampaign(campaign) {
  await syncOwnerMediaReferences({
    ownerType: "Campaign",
    ownerId: campaign._id,
    fields: { image: campaign.imageAsset ? [campaign.imageAsset] : [] },
  });
}

exports.createCampaign = async (req, res) => {
  try {
    const { title, subtitle, buttonText } = req.body;
    if (!title || !buttonText) {
      return res.status(400).json({ message: "Başlık ve buton metni zorunludur." });
    }
    const products = parseArrayField(req.body.products);
    const categories = parseArrayField(req.body.categories);
    await validateTargets(products, categories);
    const [asset] = await requireReadyAssets(req.body.imageAssetId, {
      purpose: "campaign_image",
      kind: "image",
      min: 1,
      max: 1,
    });
    const campaign = await Campaign.create({
      title,
      subtitle,
      buttonText,
      imageAsset: asset._id,
      imageUrl: legacyAssetUrl(asset, "detail"),
      products,
      categories,
    });
    await syncCampaign(campaign);
    const populated = await campaignQuery(Campaign.findById(campaign._id));
    res.status(201).json(serializeCampaign(populated));
  } catch (error) {
    if (error instanceof MediaError || error.statusCode) throw error;
    console.error(error);
    res.status(500).json({ message: "Kampanya oluşturulamadı." });
  }
};

exports.getCampaigns = async (_req, res) => {
  try {
    const campaigns = await campaignQuery(Campaign.find());
    res.json(campaigns.map((campaign) => serializeCampaign(campaign)));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Kampanyalar getirilemedi." });
  }
};

exports.getCampaign = async (req, res) => {
  try {
    const campaign = await campaignQuery(Campaign.findById(req.params.id));
    if (!campaign) return res.status(404).json({ message: "Kampanya bulunamadı." });
    res.json(serializeCampaign(campaign, "detail"));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Kampanya getirilemedi." });
  }
};

exports.updateCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ message: "Kampanya bulunamadı." });
    if (!req.body.title || !req.body.buttonText) {
      return res.status(400).json({ message: "Başlık ve buton metni zorunludur." });
    }
    const products = parseArrayField(req.body.products);
    const categories = parseArrayField(req.body.categories);
    await validateTargets(products, categories);
    campaign.title = req.body.title;
    campaign.buttonText = req.body.buttonText;
    campaign.subtitle = req.body.subtitle ?? campaign.subtitle;
    campaign.products = products;
    campaign.categories = categories;
    if (req.body.imageAssetId !== undefined) {
      const [asset] = await requireReadyAssets(req.body.imageAssetId, {
        purpose: "campaign_image",
        kind: "image",
        min: 1,
        max: 1,
      });
      campaign.imageAsset = asset._id;
      campaign.imageUrl = legacyAssetUrl(asset, "detail");
    }
    await campaign.save();
    await syncCampaign(campaign);
    const populated = await campaignQuery(Campaign.findById(campaign._id));
    res.json(serializeCampaign(populated));
  } catch (error) {
    if (error instanceof MediaError || error.statusCode) throw error;
    console.error(error);
    res.status(500).json({ message: "Kampanya güncellenemedi." });
  }
};

exports.deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndDelete(req.params.id);
    if (!campaign) return res.status(404).json({ message: "Kampanya bulunamadı." });
    await removeOwnerMediaReferences("Campaign", campaign._id);
    res.json({ message: "Kampanya silindi." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Kampanya silinemedi." });
  }
};

exports.setActiveCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ message: "Kampanya bulunamadı." });
    await Campaign.updateMany({ _id: { $ne: campaign._id } }, { $set: { isActive: false } });
    campaign.isActive = true;
    await campaign.save();
    res.json({ message: "Kampanya aktif edildi." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Kampanya aktifleştirilemedi." });
  }
};

exports.getActiveCampaign = async (_req, res) => {
  try {
    const campaign = await campaignQuery(Campaign.findOne({ isActive: true }));
    if (!campaign) return res.status(404).json({ message: "Aktif kampanya bulunamadı." });
    let items = [];
    if (campaign.products?.length) {
      items = campaign.products.map((product) => applyProductMedia(product, "list"));
    } else if (campaign.categories?.length) {
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
    const serialized = serializeCampaign(campaign, "detail");
    res.json({ ...serialized, items });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Aktif kampanya getirilemedi." });
  }
};
