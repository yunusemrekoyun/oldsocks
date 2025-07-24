// backend/controllers/miniCampaignController.js
const MiniCampaign = require("../models/MiniCampaign");
const Product = require("../models/Product");
const Category = require("../models/Category");

// Helper to parse JSON-array fields (body’dan gelen products/categories)
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

// Helper to parse slot (string’ten Integer’a)
function parseSlot(raw) {
  const n = Number(raw);
  return Number.isInteger(n) ? n : undefined;
}

// — Admin CRUD —

// Create a new mini campaign
exports.createMiniCampaign = async (req, res) => {
  try {
    const { title } = req.body;
    const slot = parseSlot(req.body.slot);
    const products = parseArrayField(req.body.products);
    const categories = parseArrayField(req.body.categories);

    // Zorunluluk kontrolleri
    if (!title || slot === undefined || !req.file) {
      return res.status(400).json({
        message: "title, slot (1 veya 2) ve image zorunludur.",
      });
    }
    if (![1, 2].includes(slot)) {
      return res
        .status(400)
        .json({ message: "slot değeri sadece 1 veya 2 olabilir." });
    }

    // ID validasyonları
    for (let pid of products) {
      if (!(await Product.exists({ _id: pid }))) {
        return res.status(400).json({ message: `Invalid product ID: ${pid}` });
      }
    }
    for (let cid of categories) {
      if (!(await Category.exists({ _id: cid }))) {
        return res.status(400).json({ message: `Invalid category ID: ${cid}` });
      }
    }

    // Aynı slot’u kullanan varsa temizle
    await MiniCampaign.updateMany({ slot }, { $unset: { slot: "" } });

    // Yeni kayıt
    const mini = await MiniCampaign.create({
      title,
      imageUrl: req.file.path,
      products,
      categories,
      slot,
    });

    res.status(201).json(mini);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Error creating mini campaign.", error: err.message });
  }
};

// Read all mini campaigns
exports.getMiniCampaigns = async (req, res) => {
  try {
    const list = await MiniCampaign.find()
      .populate("products", "name images price")
      .populate("categories", "name image")
      .sort("slot");
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching mini campaigns." });
  }
};

// Read single mini campaign
exports.getMiniCampaign = async (req, res) => {
  try {
    const mc = await MiniCampaign.findById(req.params.id)
      .populate("products", "name images price")
      .populate("categories", "name image");
    if (!mc)
      return res.status(404).json({ message: "MiniCampaign not found." });
    res.json(mc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching mini campaign." });
  }
};

// Update mini campaign by ID
exports.updateMiniCampaign = async (req, res) => {
  try {
    const { title } = req.body;
    const slot = parseSlot(req.body.slot);
    const products = parseArrayField(req.body.products);
    const categories = parseArrayField(req.body.categories);

    if (!title || slot === undefined) {
      return res
        .status(400)
        .json({ message: "title ve slot (1 veya 2) zorunludur." });
    }
    if (![1, 2].includes(slot)) {
      return res
        .status(400)
        .json({ message: "slot değeri sadece 1 veya 2 olabilir." });
    }

    // ID validasyonları
    for (let pid of products) {
      if (!(await Product.exists({ _id: pid }))) {
        return res.status(400).json({ message: `Invalid product ID: ${pid}` });
      }
    }
    for (let cid of categories) {
      if (!(await Category.exists({ _id: cid }))) {
        return res.status(400).json({ message: `Invalid category ID: ${cid}` });
      }
    }

    // Diğer aynı slot’ta olanları temizle (kendisi hariç)
    await MiniCampaign.updateMany(
      { slot, _id: { $ne: req.params.id } },
      { $unset: { slot: "" } }
    );

    const updates = { title, products, categories, slot };
    if (req.file) updates.imageUrl = req.file.path;

    const updated = await MiniCampaign.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );
    if (!updated)
      return res.status(404).json({ message: "MiniCampaign not found." });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating mini campaign." });
  }
};

// Delete mini campaign
exports.deleteMiniCampaign = async (req, res) => {
  try {
    const d = await MiniCampaign.findByIdAndDelete(req.params.id);
    if (!d) return res.status(404).json({ message: "MiniCampaign not found." });
    res.json({ message: "MiniCampaign deleted." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting mini campaign." });
  }
};

// Activate one mini campaign (slot atama)
exports.setActiveMiniCampaign = async (req, res) => {
  try {
    const mc = await MiniCampaign.findById(req.params.id);
    if (!mc)
      return res.status(404).json({ message: "MiniCampaign not found." });

    const slot = parseSlot(req.query.slot);
    if (![1, 2].includes(slot)) {
      return res
        .status(400)
        .json({ message: "slot parametresi 1 veya 2 olmalı." });
    }

    // Aynı slot’u kullanan diğer kayıtları temizle
    await MiniCampaign.updateMany({ slot }, { $unset: { slot: "" } });

    // Bu kampanyayı seçilen slot’a ata
    mc.slot = slot;
    await mc.save();

    res.json({ message: `MiniCampaign ${mc._id} artık slot ${slot}.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error setting active mini campaign." });
  }
};

// Public: get all active mini campaigns (slot sırasıyla)
exports.getActiveMiniCampaigns = async (req, res) => {
  try {
    const slot = Number(req.query.slot);
    const query =
      Number.isInteger(slot) && [1, 2].includes(slot)
        ? { slot }
        : { isActive: true };

    const mc = await MiniCampaign.findOne(query);
    if (!mc)
      return res.status(404).json({ message: "MiniCampaign bulunamadı." });

    let items = [];
    if (mc.products?.length > 0) {
      items = await Product.find({ _id: { $in: mc.products } })
        .select("name images price originalPrice discount video")
        .lean();
    } else if (mc.categories?.length > 0) {
      const subs = await Category.find({
        parent: { $in: mc.categories },
      }).select("_id");
      const catIds = [
        ...mc.categories.map((c) => c.toString()),
        ...subs.map((c) => c._id.toString()),
      ];
      items = await Product.find({ category: { $in: catIds } })
        .select("name images price originalPrice discount video")
        .lean();
    }

    return res.json({
      _id: mc._id,
      title: mc.title,
      slot: mc.slot,
      imageUrl: mc.imageUrl,
      items, // ← burada kategori/alt kategori bazlı ürünler de geliyor
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching active mini campaign." });
  }
};
