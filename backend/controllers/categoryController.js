// backend/controllers/categoryController.js
const Category = require("../models/Category");
const Product = require("../models/Product");

const CATEGORIES_CACHE_TTL = 60 * 1000; // 60 sn
let categoriesCache = { data: null, expiry: 0 };

function invalidateCategoriesCache() {
  categoriesCache = { data: null, expiry: 0 };
}

// — Public —

// Sadece ana kategorileri getir, children ile birlikte
exports.getCategories = async (req, res) => {
  try {
    const now = Date.now();
    if (categoriesCache.data && now < categoriesCache.expiry) {
      return res.json(categoriesCache.data);
    }

    const roots = await Category.find({ parent: null })
      .populate("children", "name image")
      .sort("name")
      .lean();

    categoriesCache = {
      data: roots,
      expiry: Date.now() + CATEGORIES_CACHE_TTL,
    };
    res.json(roots);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Kategoriler getirilirken hata oluştu." });
  }
};

// Tek bir kategori getir (genelde detaya girerken kullanılır)
exports.getCategory = async (req, res) => {
  try {
    const cat = await Category.findById(req.params.id)
      .populate("children", "name image")
      .populate("parent", "name");
    if (!cat) return res.status(404).json({ message: "Kategori bulunamadı." });
    res.json(cat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Kategori getirilirken hata oluştu." });
  }
};

// — Admin —

// Yeni kategori (+opsiyonel virgülle ayrılmış alt kategorileri de ekler)
exports.createCategory = async (req, res) => {
  try {
    const { name, children } = req.body;
    const image = req.file?.path;
    if (!name || !image) {
      return res.status(400).json({ message: "İsim ve görsel zorunludur." });
    }

    const newCat = await Category.create({ name, image, parent: null });

    // çocuk isimleri virgülle geldiyse, hepsini bu ana kategoriye bağla
    if (children) {
      const names = children
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
      await Promise.all(
        names.map((nm) =>
          Category.create({ name: nm, image, parent: newCat._id })
        )
      );
    }

    // dönerken populate et
    const populated = await Category.findById(newCat._id)
      .populate("children", "name image")
      .lean();
    invalidateCategoriesCache();
    res.status(201).json(populated);
  } catch (err) {
    // 🔴 Yalnızca dosya boyutu hatasını yakala
    if (
      err &&
      (err.code === "LIMIT_FILE_SIZE" ||
        /File size too large/i.test(err.message))
    ) {
      const maxMB = 10; // backend limitin (MB)
      return res.status(413).json({
        message: `Dosya boyutu çok büyük. Lütfen ${maxMB}MB altında JPG/PNG yükleyin.`,
      });
    }

    console.error(err);
    res.status(500).json({ message: "Kategori oluşturulurken hata oluştu." });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { name, children } = req.body;
    const updates = {};
    if (typeof name === "string") updates.name = name;
    if (req.file) updates.image = req.file.path;

    // 1) Ana kategoriyi güncelle
    const updated = await Category.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    });
    if (!updated)
      return res.status(404).json({ message: "Kategori bulunamadı." });

    // 2) Çocuk listesi geldiyse, ID'leri KORUYARAK güncelle
    if (children !== undefined) {
      const desiredNames = children
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);

      const existingChildren = await Category.find({ parent: updated._id });

      const desiredSet = new Set(desiredNames.map((n) => n.toLowerCase()));
      const existingByName = new Map(
        existingChildren.map((c) => [c.name.toLowerCase(), c])
      );

      const toCreate = desiredNames.filter(
        (nm) => !existingByName.has(nm.toLowerCase())
      );
      const toKeep = existingChildren.filter((c) =>
        desiredSet.has(c.name.toLowerCase())
      );
      const toDelete = existingChildren.filter(
        (c) => !desiredSet.has(c.name.toLowerCase())
      );

      if (toCreate.length > 0) {
        await Promise.all(
          toCreate.map((nm) =>
            Category.create({
              name: nm,
              image: updated.image,
              parent: updated._id,
            })
          )
        );
      }

      const blocked = [];
      for (const c of toDelete) {
        const inUse = await Product.exists({ category: c._id });
        if (inUse) {
          blocked.push({ id: c._id.toString(), name: c.name });
          continue;
        }
        await Category.findByIdAndDelete(c._id);
      }

      if (req.file) {
        await Category.updateMany(
          { _id: { $in: toKeep.map((c) => c._id) } },
          { $set: { image: updated.image } }
        );
      }

      if (blocked.length > 0) {
        const blockedIds = blocked.map((b) => b.id);
        const products = await Product.find({ category: { $in: blockedIds } })
          .select("_id name images category")
          .limit(12 * blockedIds.length)
          .lean();

        const byCat = new Map();
        for (const b of blocked) {
          byCat.set(b.id, {
            categoryId: b.id,
            categoryName: b.name,
            products: [],
          });
        }
        for (const p of products) {
          const catId = (p.category || "").toString();
          if (!byCat.has(catId)) continue;
          byCat.get(catId).products.push({
            _id: p._id,
            name: p.name,
            image: Array.isArray(p.images) && p.images[0] ? p.images[0] : "",
          });
        }

        const populated = await Category.findById(updated._id)
          .populate("children", "name image")
          .populate("parent", "name")
          .lean();

        invalidateCategoriesCache();
        return res.status(409).json({
          message:
            "Bazı alt kategoriler ürüne bağlı olduğu için silinmedi. Lütfen önce bu ürünleri taşıyın ya da alt kategorileri yeniden düzenleyin.",
          blocked,
          productsByCategory: Array.from(byCat.values()),
          category: populated,
        });
      }
    }

    const populated = await Category.findById(updated._id)
      .populate("children", "name image")
      .populate("parent", "name")
      .lean();

    invalidateCategoriesCache();
    res.json(populated);
  } catch (err) {
    // 🔴 Güncellemede de aynı kontrol
    if (
      err &&
      (err.code === "LIMIT_FILE_SIZE" ||
        /File size too large/i.test(err.message))
    ) {
      const maxMB = 10;
      return res.status(413).json({
        message: `Dosya boyutu çok büyük. Lütfen ${maxMB}MB altında JPG/PNG yükleyin.`,
      });
    }

    console.error(err);
    res.status(500).json({ message: "Kategori güncellenirken hata oluştu." });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const cat = await Category.findByIdAndDelete(req.params.id);
    if (!cat) return res.status(404).json({ message: "Kategori bulunamadı." });
    invalidateCategoriesCache();
    res.json({ message: "Kategori silindi." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Kategori silinirken hata oluştu." });
  }
};
