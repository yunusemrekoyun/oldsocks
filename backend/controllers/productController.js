const Product = require("../models/Product");
const Category = require("../models/Category");

// CREATE (Admin)
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      price,
      originalPrice,
      discount,
      category,
      stock,
      sizes,
      description,
      color,
    } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Ürün adı zorunlu." });
    }
    if (!(await Category.exists({ _id: category }))) {
      return res.status(400).json({ message: "Geçersiz kategori." });
    }

    const videoUrl = req.files.video?.[0]?.path;
    const imagesUrls = req.files.images?.map((f) => f.path) || [];
    if (!videoUrl || imagesUrls.length === 0) {
      return res
        .status(400)
        .json({ message: "Video ve en az bir resim zorunlu." });
    }

    const sizesArr = sizes
      ? sizes
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const product = await Product.create({
      name,
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

// GET ALL (listeleme: name + hover-video + first image + temel alanlar)
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .select(
        "name video images price originalPrice discount sizes color category"
      )
      .populate({
        path: "category",
        select: "name image parent",
        populate: {
          path: "parent",
          select: "name",
        },
      });
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Ürünler getirilirken hata oluştu." });
  }
};
// GET SINGLE
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .select(
        "video images price originalPrice discount category stock sizes description color name"
      )
      .populate({
        path: "category",
        select: "name image parent",
        populate: { path: "parent", select: "name" },
      });
    if (!product) return res.status(404).json({ message: "Ürün bulunamadı." });
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Ürün getirilirken hata oluştu." });
  }
};

// UPDATE (Admin)
exports.updateProduct = async (req, res) => {
  try {
    const existing = await Product.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Ürün bulunamadı." });
    }

    const updates = { ...req.body };

    // name güncellemesi
    if (!updates.name) {
      return res.status(400).json({ message: "Ürün adı zorunlu." });
    }

    // video ve images dosyaları
    const newVideo = req.files.video?.[0]?.path;
    const newImages = req.files.images?.map((f) => f.path);
    updates.video = newVideo || existing.video;
    updates.images = newImages?.length ? newImages : existing.images;

    // sizes string → array
    if (updates.sizes) {
      updates.sizes = updates.sizes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    // category validasyonu
    if (
      updates.category &&
      !(await Category.exists({ _id: updates.category }))
    ) {
      return res.status(400).json({ message: "Geçersiz kategori." });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );

    res.json(updatedProduct);
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
