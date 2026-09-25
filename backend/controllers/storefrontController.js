const mongoose = require("mongoose");
const StorefrontSettings = require("../models/StorefrontSettings");
const Product = require("../models/Product");
const Category = require("../models/Category");
const Order = require("../models/Order");
const { timedCache } = require("../services/timedCache");

const defaults = Object.freeze({
  fontPreset: "classic",
  heroButtonOpacity: 30,
  sectionOrder: ["new", "featured", "popular"],
  sections: {
    new: { heading: "Yeni Eklenen Ürünler", source: "latest", categoryId: null, productIds: [], shuffle: true, visible: true },
    featured: { heading: "Öne Çıkan Ürünler", source: "random", categoryId: null, productIds: [], shuffle: true, visible: true },
    popular: { heading: "Çok Satan Ürünler", source: "best_selling", categoryId: null, productIds: [], shuffle: false, visible: true },
  },
});
const sectionKeys = ["new", "featured", "popular"];
const validSectionOrder = (order) => Array.isArray(order)
  && order.length === sectionKeys.length
  && sectionKeys.every((key) => order.includes(key))
  && new Set(order).size === sectionKeys.length;
const sources = new Set(["latest", "best_selling", "category", "manual", "random"]);
const fonts = new Set(["classic", "modern", "fashion"]);
const settingsCache = timedCache(30_000);
const bestSellersCache = timedCache(5 * 60_000);

function publicSettings(doc) {
  if (!doc) return defaults;
  const value = doc.toObject ? doc.toObject() : doc;
  return {
    fontPreset: value.fontPreset,
    heroButtonOpacity: value.heroButtonOpacity ?? defaults.heroButtonOpacity,
    sectionOrder: validSectionOrder(value.sectionOrder) ? value.sectionOrder : defaults.sectionOrder,
    sections: Object.fromEntries(sectionKeys.map((key) => {
      const section = value.sections[key];
      return [key, {
        heading: section.heading,
        source: section.source,
        categoryId: section.categoryId ? String(section.categoryId) : null,
        productIds: section.productIds.map(String),
        shuffle: section.shuffle,
        visible: section.visible !== false,
      }];
    })),
  };
}

async function loadSettings() {
  return settingsCache.get(async () => publicSettings(await StorefrontSettings.findOne({ key: "main" })));
}

async function bestSellerIds() {
  return bestSellersCache.get(async () => {
    const rows = await Order.aggregate([
      { $match: { status: { $in: ["paid", "shipped", "completed"] } } },
      { $unwind: "$items" },
      { $group: { _id: "$items.productId", quantity: { $sum: "$items.qty" } } },
      { $sort: { quantity: -1, _id: 1 } },
    ]);
    const active = await Product.find({
      _id: { $in: rows.map((row) => row._id) },
      archivedAt: null,
    }).select("_id").lean();
    const activeIds = new Set(active.map((product) => String(product._id)));
    return rows.map((row) => String(row._id)).filter((id) => activeIds.has(id)).slice(0, 40);
  });
}

exports.getPublic = async (_req, res) => {
  const settings = await loadSettings();
  const needsSales = sectionKeys.some((key) => settings.sections[key].visible && settings.sections[key].source === "best_selling");
  const bestSellingProductIds = needsSales ? await bestSellerIds() : [];
  res.set("Cache-Control", "public, max-age=5, s-maxage=5");
  res.json({ ...settings, bestSellingProductIds });
};

exports.getAdmin = async (_req, res) => {
  res.set("Cache-Control", "no-store");
  res.json(await loadSettings());
};

exports.update = async (req, res) => {
  const input = req.body || {};
  const currentSettings = await loadSettings();
  if (!fonts.has(input.fontPreset)) {
    return res.status(400).json({ message: "Yazı ailesi geçersiz." });
  }
  const heroButtonOpacity = Number(input.heroButtonOpacity ?? currentSettings.heroButtonOpacity);
  if (!Number.isInteger(heroButtonOpacity) || heroButtonOpacity < 0 || heroButtonOpacity > 100) {
    return res.status(400).json({ message: "Hero buton opaklığı 0–100 arasında olmalıdır." });
  }
  const sectionOrder = input.sectionOrder ?? currentSettings.sectionOrder;
  if (!validSectionOrder(sectionOrder)) {
    return res.status(400).json({ message: "Ürün alanlarının sırası geçersiz." });
  }
  const sections = {};
  for (const key of sectionKeys) {
    const row = input.sections?.[key];
    const heading = String(row?.heading || "").trim();
    const source = row?.source;
    const categoryId = row?.categoryId || null;
    const productIds = Array.isArray(row?.productIds) ? row.productIds : [];
    const visible = row?.visible ?? currentSettings.sections[key].visible;
    if (!heading || heading.length > 80 || !sources.has(source)) {
      return res.status(400).json({ message: `${key} alanının başlığı veya kaynağı geçersiz.` });
    }
    if (typeof visible !== "boolean") {
      return res.status(400).json({ message: `${key} görünürlük ayarı geçersiz.` });
    }
    if (visible && source === "category" && !mongoose.isValidObjectId(categoryId)) {
      return res.status(400).json({ message: `${key} için kategori seçin.` });
    }
    if (source === "manual" && (productIds.length > 40 || (visible && !productIds.length))) {
      return res.status(400).json({ message: `${key} için 1–40 ürün seçin.` });
    }
    if (productIds.some((id) => !mongoose.isValidObjectId(id))) {
      return res.status(400).json({ message: `${key} ürün seçimi geçersiz.` });
    }
    sections[key] = {
      heading,
      source,
      categoryId: source === "category" && mongoose.isValidObjectId(categoryId) ? categoryId : null,
      productIds: source === "manual" ? [...new Set(productIds)] : [],
      shuffle: Boolean(row.shuffle),
      visible,
    };
  }

  for (const key of sectionKeys) {
    const row = sections[key];
    if (row.visible && row.source === "category" && !(await Category.exists({ _id: row.categoryId, archivedAt: null }))) {
      return res.status(400).json({ message: `${key} kategorisi bulunamadı.` });
    }
    if (row.visible && row.source === "manual") {
      const count = await Product.countDocuments({ _id: { $in: row.productIds }, archivedAt: null });
      if (count !== row.productIds.length) {
        return res.status(400).json({ message: `${key} içindeki ürünlerden biri bulunamadı.` });
      }
    }
  }

  const doc = await StorefrontSettings.findOneAndUpdate(
    { key: "main" },
    { $set: { fontPreset: input.fontPreset, heroButtonOpacity, sectionOrder, sections } },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );
  settingsCache.invalidate();
  res.set("Cache-Control", "no-store");
  res.json(publicSettings(doc));
};
