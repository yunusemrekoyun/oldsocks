// controllers/productController.js
const Product = require("../models/Product");
const Category = require("../models/Category");

/* ------------------------------------------------------------------ */
/*  Yardımcı Fonksiyonlar                                             */
/* ------------------------------------------------------------------ */

/** sizes alanını güvenle parse eder.
 *  Giriş ≈ '[{"size":"M","stock":5},…]'  |  Çıkış ≈ [{ size:"M", stock:5 }, …]
 *  Boş/yanlış formata toleranslıdır, bedensiz üründe [] döner.        */
const parseSizes = (raw) => {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return arr
      .filter((s) => typeof s.stock === "number")
      .map((s) => ({ size: (s.size || "").trim(), stock: s.stock }));
  } catch {
    return []; // hatalı JSON → bedensiz kabul
  }
};

/* ------------------------------------------------------------------ */
/*  CREATE (Admin)                                                    */
/* ------------------------------------------------------------------ */
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      price,
      originalPrice,
      discount,
      category,
      sizes,
      description,
      color,
    } = req.body;

    if (!name) return res.status(400).json({ message: "Ürün adı zorunlu." });

    if (!(await Category.exists({ _id: category }))) {
      return res.status(400).json({ message: "Geçersiz kategori." });
    }

    const videoUrl = req.files.video?.[0]?.path;
    const imagesUrls = req.files.images?.map((f) => f.path) || [];

    if (!videoUrl || imagesUrls.length === 0) {
      return res
        .status(400)
        .json({ message: "Video ve en az bir resim zorunludur." });
    }

    const product = await Product.create({
      name,
      video: videoUrl,
      images: imagesUrls,
      price: Number(price),
      originalPrice: Number(originalPrice),
      discount: Number(discount || 0),
      category,
      sizes: parseSizes(sizes),
      description,
      color: color || "", // renk opsiyonel
      parentProductId: null, // base ürün
    });

    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Ürün oluşturulurken hata oluştu." });
  }
};

/* ------------------------------------------------------------------ */
/*  GET  (listeleme / varyant sorgusu)                                */
/* ------------------------------------------------------------------ */
exports.getProducts = async (req, res) => {
  try {
    /* /products?varyantsOf=BASE_ID → base + child renkler */
    if (req.query.varyantsOf) {
      const baseId = req.query.varyantsOf;
      const products = await Product.find({
        $or: [{ _id: baseId }, { parentProductId: baseId }],
      }).select("color _id name");
      return res.json(products);
    }

    /* normal listeleme */
    const products = await Product.find()
      .select(
        "name video images price originalPrice discount sizes color category"
      )
      .populate({
        path: "category",
        select: "name image parent",
        populate: { path: "parent", select: "name" },
      });

    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Ürünler getirilirken hata oluştu." });
  }
};

/* ------------------------------------------------------------------ */
/*  GET SINGLE                                                        */
/* ------------------------------------------------------------------ */
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .select(
        "video images price originalPrice discount category sizes description color name parentProductId"
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

/* ------------------------------------------------------------------ */
/*  UPDATE (Admin)                                                    */
/* ------------------------------------------------------------------ */
exports.updateProduct = async (req, res) => {
  try {
    const existing = await Product.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Ürün bulunamadı." });
    }

    const {
      name,
      price,
      originalPrice,
      discount,
      category,
      sizes,
      description,
      color,
    } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Ürün adı zorunlu." });
    }

    /* Kategori doğrulaması (opsiyonel) */
    if (category && !(await Category.exists({ _id: category }))) {
      return res.status(400).json({ message: "Geçersiz kategori." });
    }

    /* Dosyalar */
    const newVideo = req.files?.video?.[0]?.path;
    const newImages = req.files?.images?.map((f) => f.path) || [];

    /* Güncellenecek alanlar */
    const updates = {
      name,
      price: price !== undefined ? Number(price) : existing.price,
      originalPrice:
        originalPrice !== undefined
          ? Number(originalPrice)
          : existing.originalPrice,
      discount: discount !== undefined ? Number(discount) : existing.discount,
      category: category || existing.category,
      description:
        description !== undefined ? description : existing.description,
      color: color !== undefined ? color : existing.color,
      video: newVideo || existing.video,
      images: newImages.length
        ? [...existing.images, ...newImages]
        : existing.images,
      sizes: sizes ? parseSizes(sizes) : existing.sizes,
    };

    const updated = await Product.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Ürün güncellenirken hata oluştu." });
  }
};

/* ------------------------------------------------------------------ */
/*  DELETE (Admin)                                                    */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/*  POST /api/products/new-color/:baseProductId                       */
/* ------------------------------------------------------------------ */
exports.createProductWithNewColor = async (req, res) => {
  try {
    /* ──────────────────────────────────
       1) Parametre & temel kontroller
       ────────────────────────────────── */
    const baseId = req.params.baseProductId;
    const { color, sizes, price, originalPrice, discount, description, name } =
      req.body;

    if (!color || !color.trim())
      return res.status(400).json({ message: "Renk zorunludur." });

    const base = await Product.findById(baseId);
    if (!base) return res.status(404).json({ message: "Ana ürün bulunamadı." });

    /* Aynı renkten zaten var mı?
+     • base ürünün kendisinde bu renk olabilir
+     • ya da daha önce eklenmiş bir child varyantta            */
    const duplicate = await Product.findOne({
      $or: [{ _id: baseId }, { parentProductId: baseId }],
      color: { $regex: new RegExp("^" + color.trim() + "$", "i") },
    });
    if (duplicate)
      return res.status(409).json({ message: "Bu renkte varyant zaten var." });

    /* ──────────────────────────────────
       2) Medya (yeni yüklendiyse kullan; yoksa base’ten miras al)
       ────────────────────────────────── */
    const video =
      req.files?.video?.[0]?.path || // yeni video geldiyse
      base.video; // yoksa eski video

    const images =
      req.files?.images?.map((f) => f.path) || // yeni görseller
      base.images; // eski görseller

    if (!video || images.length === 0)
      return res
        .status(400)
        .json({ message: "Video ve en az bir resim yüklenmelidir." });

    /* ──────────────────────────────────
       3) Yeni ürün kaydı
       ────────────────────────────────── */
    const newProduct = await Product.create({
      /* base’ten miras aldıklarımız */
      name: name ?? base.name,
      price: price ?? base.price,
      originalPrice: originalPrice ?? base.originalPrice,
      discount: discount ?? base.discount,
      description: description ?? base.description,
      category: base.category, // 💡 kategori & alt kategori sabit
      parentProductId: base._id,

      /* yeni / override alanlar */
      video,
      images,
      color: color.trim(),
      sizes: parseSizes(sizes) || base.sizes,
    });

    res.status(201).json(newProduct);
  } catch (err) {
    console.error("Yeni renk ekleme hatası:", err);
    res
      .status(500)
      .json({ message: "Yeni renk eklenirken beklenmeyen bir hata oluştu." });
  }
};
