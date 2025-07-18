// backend/controllers/categoryController.js
const Category = require("../models/Category");

// — Public —

// Tüm kategorileri parent + children populate ile getir
exports.getCategories = async (req, res) => {
  try {
    const cats = await Category.find()
      .populate("parent", "name")
      .populate("children", "name image parent");
    res.json(cats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Kategoriler getirilirken hata oluştu." });
  }
};

// Tek bir kategori getir
exports.getCategory = async (req, res) => {
  try {
    const cat = await Category.findById(req.params.id)
      .populate("parent", "name")
      .populate("children", "name image parent");
    if (!cat) return res.status(404).json({ message: "Kategori bulunamadı." });
    res.json(cat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Kategori getirilirken hata oluştu." });
  }
};

// — Admin —

// Yeni kategori + isteğe bağlı alt kategorileri de oluştur
exports.createCategory = async (req, res) => {
  try {
    const { name, parent, children } = req.body;
    const image = req.file?.path;
    if (!name || !image) {
      return res.status(400).json({ message: "İsim ve görsel zorunludur." });
    }
    // parent varsa kontrol et
    if (parent && !(await Category.exists({ _id: parent }))) {
      return res.status(400).json({ message: "Geçersiz parent kategori." });
    }
    // 1) Ana kategoriyi oluştur
    const newCat = await Category.create({
      name,
      image,
      parent: parent || null,
    });
    // 2) Eğer kullanıcı virgülle ayırarak gönderdiği alt kategori isimleri varsa, her birini ekle
    if (children) {
      const names = children
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      await Promise.all(
        names.map((childName) =>
          Category.create({ name: childName, image, parent: newCat._id })
        )
      );
    }
    // 3) populate edip dön
    const populated = await Category.findById(newCat._id)
      .populate("parent", "name")
      .populate("children", "name image parent");
    res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Kategori oluşturulurken hata oluştu." });
  }
};

// Var olan kategoriyi güncelle ve isteğe bağlı yeni alt kategorileri ekle
exports.updateCategory = async (req, res) => {
  try {
    const { name, parent, children } = req.body;
    const updates = { name };
    if (req.file) updates.image = req.file.path;
    // parent kontrolü
    if (parent) {
      if (!(await Category.exists({ _id: parent }))) {
        return res.status(400).json({ message: "Geçersiz parent kategori." });
      }
      updates.parent = parent;
    } else {
      updates.parent = null;
    }
    // kategori güncelle
    const updated = await Category.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    });
    if (!updated)
      return res.status(404).json({ message: "Kategori bulunamadı." });
    // alt kategorileri ekle
    if (children) {
      const names = children
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      await Promise.all(
        names.map((childName) =>
          Category.create({
            name: childName,
            image: updated.image,
            parent: updated._id,
          })
        )
      );
    }
    // populate edip dön
    const populated = await Category.findById(updated._id)
      .populate("parent", "name")
      .populate("children", "name image parent");
    res.json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Kategori güncellenirken hata oluştu." });
  }
};

// Sil
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
