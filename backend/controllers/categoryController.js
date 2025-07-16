// backend/controllers/categoryController.js
const Category = require("../models/Category");

// — Public —
exports.getCategories = async (req, res) => {
  try {
    const cats = await Category.find().populate("parent", "name");
    res.json(cats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Kategoriler getirilirken hata oluştu." });
  }
};

exports.getCategory = async (req, res) => {
  try {
    const cat = await Category.findById(req.params.id).populate(
      "parent",
      "name"
    );
    if (!cat) return res.status(404).json({ message: "Kategori bulunamadı." });
    res.json(cat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Kategori getirilirken hata oluştu." });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, parent } = req.body;
    const image = req.file?.path; // Cloudinary URL

    if (!name || !image) {
      return res.status(400).json({ message: "İsim ve görsel zorunludur." });
    }

    if (parent && !(await Category.exists({ _id: parent }))) {
      return res.status(400).json({ message: "Geçersiz parent kategori." });
    }

    const newCategory = await Category.create({ name, image, parent });
    res.status(201).json(newCategory);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Kategori oluşturulurken hata oluştu." });
  }
};
exports.updateCategory = async (req, res) => {
  try {
    const { name, parent } = req.body;

    // Güncelleme objesini oluştur
    const updates = { name };

    // Yeni görsel yüklendiyse güncelle
    if (req.file) {
      updates.image = req.file.path; // Cloudinary'den gelen URL
    }

    // Parent varsa geçerli mi kontrol et
    if (parent) {
      const parentExists = await Category.exists({ _id: parent });
      if (!parentExists) {
        return res.status(400).json({ message: "Geçersiz parent kategori." });
      }
      updates.parent = parent;
    }

    const cat = await Category.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    });

    if (!cat) return res.status(404).json({ message: "Kategori bulunamadı." });

    res.json(cat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Kategori güncellenirken hata oluştu." });
  }
};

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
