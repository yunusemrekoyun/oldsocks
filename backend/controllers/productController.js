// backend/controllers/productController.js
const Product = require("../models/Product");
const Category = require("../models/Category");

// CREATE
exports.createProduct = async (req, res) => {
  try {
    const {
      price,
      originalPrice,
      discount,
      category,
      stock,
      sizes,
      description,
      color,
    } = req.body;

    // Kategori kontrolü
    if (!(await Category.exists({ _id: category }))) {
      return res.status(400).json({ message: "Geçersiz kategori." });
    }

    // Cloudinary'den gelen URL'ler
    const videoUrl = req.files.video?.[0]?.path;
    const imagesUrls = req.files.images?.map((f) => f.path) || [];

    // Bedenleri ',' ile ayrılmış ise array'e çevir
    const sizesArr = sizes ? sizes.split(",").map((s) => s.trim()) : [];

    const product = await Product.create({
      video: videoUrl,
      images: imagesUrls,
      price,
      originalPrice,
      discount,
      category,
      stock,
      sizes: sizesArr,
      description,
      color,
    });

    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Ürün oluşturulurken hata oluştu." });
  }
};
// GET ALL (Listeleme: video + ilk resim + temel alanlar)
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .select("video images price originalPrice discount category")
      .populate("category", "name image");
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Ürünler getirilirken hata oluştu." });
  }
};

// GET SINGLE (Detay: video’yı *göndermiyoruz*, detayda sadece resimler ve diğerleri)
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .select("-video") // video alanını hariç tut
      .populate("category", "name image");
    if (!product) {
      return res.status(404).json({ message: "Ürün bulunamadı." });
    }
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Ürün getirilirken hata oluştu." });
  }
};

// UPDATE
exports.updateProduct = async (req, res) => {
  try {
    const updates = { ...req.body };

    // Yeni video yüklenmiş mi?
    if (req.files.video) {
      updates.video = req.files.video[0].path;
    }
    if (req.files.images) {
      updates.images = req.files.images.map((f) => f.path);
    }

    if (
      updates.category &&
      !(await Category.exists({ _id: updates.category }))
    ) {
      return res.status(400).json({ message: "Geçersiz kategori." });
    }

    if (updates.sizes) {
      updates.sizes = updates.sizes.split(",").map((s) => s.trim());
    }

    const product = await Product.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    });

    if (!product) return res.status(404).json({ message: "Ürün bulunamadı." });

    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Ürün güncellenirken hata oluştu." });
  }
};
// DELETE (Admin)
exports.deleteProduct = async (req, res) => {
  try {
    const result = await Product.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ message: "Ürün bulunamadı." });
    }
    res.json({ message: "Ürün silindi." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Ürün silinirken hata oluştu." });
  }
};
