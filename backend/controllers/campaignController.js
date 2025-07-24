const Campaign = require("../models/Campaign");
const Product = require("../models/Product");
const Category = require("../models/Category");

// Helper to parse JSON-array fields
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

// Create
exports.createCampaign = async (req, res) => {
  try {
    const { title, subtitle, buttonText } = req.body;
    const products = parseArrayField(req.body.products);
    const categories = parseArrayField(req.body.categories);

    if (!title || !subtitle || !buttonText || !req.file) {
      return res.status(400).json({
        message: "title, subtitle, buttonText ve image zorunludur.",
      });
    }

    // Validate IDs
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

    const campaign = await Campaign.create({
      title,
      subtitle,
      buttonText,
      imageUrl: req.file.path,
      products,
      categories,
    });

    res.status(201).json(campaign);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Error creating campaign.", error: err.message });
  }
};

// Read all
exports.getCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find()
      .populate("products", "name images price")
      .populate("categories", "name image");
    res.json(campaigns);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching campaigns." });
  }
};

// Read single
exports.getCampaign = async (req, res) => {
  try {
    const c = await Campaign.findById(req.params.id)
      .populate("products", "name images price")
      .populate("categories", "name image");
    if (!c) return res.status(404).json({ message: "Campaign not found." });
    res.json(c);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching campaign." });
  }
};

// Update
exports.updateCampaign = async (req, res) => {
  try {
    const { title, subtitle, buttonText } = req.body;
    const products = parseArrayField(req.body.products);
    const categories = parseArrayField(req.body.categories);

    if (!title || !subtitle || !buttonText) {
      return res.status(400).json({
        message: "title, subtitle ve buttonText zorunludur.",
      });
    }

    // Validate IDs
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

    const updates = {
      title,
      subtitle,
      buttonText,
      products,
      categories,
    };
    if (req.file) {
      updates.imageUrl = req.file.path;
    }

    const updated = await Campaign.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    });
    if (!updated) {
      return res.status(404).json({ message: "Campaign not found." });
    }
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating campaign." });
  }
};

// Delete
exports.deleteCampaign = async (req, res) => {
  try {
    const d = await Campaign.findByIdAndDelete(req.params.id);
    if (!d) return res.status(404).json({ message: "Campaign not found." });
    res.json({ message: "Campaign deleted." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting campaign." });
  }
};

// Activate
exports.setActiveCampaign = async (req, res) => {
  try {
    const c = await Campaign.findById(req.params.id);
    if (!c) return res.status(404).json({ message: "Campaign not found." });

    await Campaign.updateMany({}, { isActive: false });
    c.isActive = true;
    await c.save();
    res.json({ message: `Campaign ${c._id} is now active.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error setting active campaign." });
  }
};

// Public: aktif kampanya + dinamik ürünler
exports.getActiveCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ isActive: true });
    if (!campaign)
      return res.status(404).json({ message: "No active campaign." });

    let items = [];

    if (campaign.products?.length > 0) {
      // Sadece belirtilen ürünler
      items = await Product.find({
        _id: { $in: campaign.products },
      })
        .select("name images price originalPrice discount video") // <-- video ekledik
        .lean();
    } else if (campaign.categories?.length > 0) {
      // (kategori mantığı aynı)…
      const subs = await Category.find({
        parent: { $in: campaign.categories },
      }).select("_id");
      const catIds = [
        ...campaign.categories.map((c) => c.toString()),
        ...subs.map((c) => c._id.toString()),
      ];
      items = await Product.find({
        category: { $in: catIds },
      })
        .select("name images price originalPrice discount video") // <-- video ekledik
        .lean();
    }

    return res.json({
      _id: campaign._id,
      title: campaign.title,
      subtitle: campaign.subtitle,
      buttonText: campaign.buttonText,
      imageUrl: campaign.imageUrl,
      items,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching active campaign." });
  }
};
