// backend/controllers/categoryController.js
const Category = require("../models/Category");

// — Public —

// Sadece ana kategorileri getir, children ile birlikte
exports.getCategories = async (req, res) => {
  try {
    const roots = await Category.find({ parent: null })
      .populate("children", "name image")
      .sort("name");
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
    const populated = await Category.findById(newCat._id).populate(
      "children",
      "name image"
    );
    res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Kategori oluşturulurken hata oluştu." });
  }
};

// Var olan ana kategoriyi güncelle (+yeni alt kategori ekleyebilirsin)
exports.updateCategory = async (req, res) => {
  try {
    const { name, children } = req.body;
    const updates = { name };
    if (req.file) updates.image = req.file.path;

    const updated = await Category.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    });
    if (!updated)
      return res.status(404).json({ message: "Kategori bulunamadı." });

    // yeni alt kategori isimleri ekle
    if (children) {
      const names = children
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
      await Promise.all(
        names.map((nm) =>
          Category.create({
            name: nm,
            image: updated.image,
            parent: updated._id,
          })
        )
      );
    }

    const populated = await Category.findById(updated._id).populate(
      "children",
      "name image"
    );
    res.json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Kategori güncellenirken hata oluştu." });
  }
};

// Sil (alt kategorileri de istersen ayrı endpoint’le silebilirsin)
exports.deleteCategory = async (req, res) => {
  try {
    const cat = await Category.findByIdAndDelete(req.params.id);
    if (!cat) return res.status(404).json({ message: "Kategori bulunamadı." });
    res.json({ message: "Kategori silindi." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Kategori silinirken hata oluştu." });
  }
};
