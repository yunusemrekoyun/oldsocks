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
      // İstenen son liste (virgül -> isim)
      const desiredNames = children
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);

      // Mevcut çocuklar
      const existingChildren = await Category.find({ parent: updated._id });

      // Hızlı erişim set & map'leri
      const desiredSet = new Set(desiredNames.map((n) => n.toLowerCase()));
      const existingByName = new Map(
        existingChildren.map((c) => [c.name.toLowerCase(), c])
      );

      // 2a) EKLENECEKLER: desired'ta olup mevcutta olmayanlar
      const toCreate = desiredNames.filter(
        (nm) => !existingByName.has(nm.toLowerCase())
      );

      // 2b) KALACAKLAR: desired'ta da mevcutta da olanlar (ID korunur)
      const toKeep = existingChildren.filter((c) =>
        desiredSet.has(c.name.toLowerCase())
      );

      // 2c) SİLİNECEKLER: mevcutta olup desired'ta olmayanlar
      const toDelete = existingChildren.filter(
        (c) => !desiredSet.has(c.name.toLowerCase())
      );

      // EKLE: yeni isimler için child oluştur
      if (toCreate.length > 0) {
        await Promise.all(
          toCreate.map((nm) =>
            Category.create({
              name: nm,
              image: updated.image, // aynı görseli kullan
              parent: updated._id,
            })
          )
        );
      }

      // SİL: yalnızca ürüne bağlı DEĞİLSE
      const blocked = [];
      for (const c of toDelete) {
        const inUse = await Product.exists({ category: c._id });
        if (inUse) {
          blocked.push({ id: c._id.toString(), name: c.name });
          continue; // bu çocuğu silemeyiz, referans var
        }
        await Category.findByIdAndDelete(c._id);
      }

      // İsteğe bağlı: kept çocukların görselini parent'ınkine eşitle
      // (name değişimi desteklemiyoruz; sadece listedekiyle aynı isimler kalır)
      if (req.file) {
        await Category.updateMany(
          { _id: { $in: toKeep.map((c) => c._id) } },
          { $set: { image: updated.image } }
        );
      }

      // Eğer silinemeyen (ürüne bağlı) çocuk varsa bilgi verelim (200 veya 409 tercihine göre)
      if (blocked.length > 0) {
        const populated = await Category.findById(updated._id)
          .populate("children", "name image")
          .populate("parent", "name");

        return res.status(409).json({
          message:
            "Bazı alt kategoriler ürüne bağlı olduğu için silinmedi. Lütfen önce o ürünleri taşıyın veya alt kategorileri yeniden düzenleyin.",
          blocked, // [{ id, name }]
          category: populated,
        });
      }
    }

    // 3) Son halini dön
    const populated = await Category.findById(updated._id)
      .populate("children", "name image")
      .populate("parent", "name");

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
