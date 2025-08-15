// controllers/productController.js
const Product = require("../models/Product");
const Category = require("../models/Category");
const DiscountRule = require("../models/DiscountRule"); // ← kurallar

/* ------------------------------------------------------------------ */
/*  Yardımcı: sizes alanını güvenle parse eder                        */
/* ------------------------------------------------------------------ */
const parseSizes = (raw) => {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return arr
      .filter((s) => typeof s.stock === "number")
      .map((s) => ({ size: (s.size || "").trim(), stock: s.stock }));
  } catch {
    return [];
  }
};

/* ------------------------------------------------------------------ */
/*  İNDİRİM KURALI YARDIMCILARI                                       */
/* ------------------------------------------------------------------ */

// Basit 15 sn bellek cache
let _ruleCache = { rules: [], expiresAt: 0 };

const _isRuleDateActive = (rule, now = new Date()) => {
  if (!rule?.isActive) return false;
  if (rule.startAt && new Date(rule.startAt) > now) return false;
  if (rule.endAt && new Date(rule.endAt) < now) return false;
  return true;
};

const _getActiveRules = async () => {
  const nowMs = Date.now();
  if (_ruleCache.expiresAt > nowMs) return _ruleCache.rules;

  const all = await DiscountRule.find({})
    .select(
      "selectionType targetIds discountRate overrideExisting startAt endAt isActive title"
    )
    .lean();

  const active = all.filter((r) => _isRuleDateActive(r));
  _ruleCache = { rules: active, expiresAt: nowMs + 15_000 };
  return active;
};

const _idStr = (x) => (x ? String(x) : "");

const _matchesRule = (rule, product) => {
  const targets = new Set((rule.targetIds || []).map(_idStr));
  const pid = _idStr(product._id);

  // Kategori bilgisi (populate edilmiş olabilir)
  const cat =
    product.category && typeof product.category === "object"
      ? product.category
      : { _id: product.category };

  const catId = _idStr(cat?._id);
  const parentId =
    cat && cat.parent && typeof cat.parent === "object"
      ? _idStr(cat.parent?._id)
      : _idStr(cat?.parent);

  if (rule.selectionType === "product") {
    return targets.has(pid);
  }
  if (rule.selectionType === "subcategory") {
    // doğrudan ürünün category'si hedef
    return catId && targets.has(catId);
  }
  if (rule.selectionType === "category") {
    // kök kategori: ürünün category'si veya parent'ı eşleşebilir
    return (catId && targets.has(catId)) || (parentId && targets.has(parentId));
  }
  return false;
};

// Ürünün kendi indirimi (product.discount) ile kural indirimi uzlaştırma
const _computeEffectiveDiscount = (product, matchedRules) => {
  const productDisc =
    Number(product.discount ?? product.discountRate ?? 0) || 0;

  if (!matchedRules.length) return productDisc;

  // Birden fazla kural varsa en yüksek yüzdeliyi seç
  const best = matchedRules.reduce((acc, r) => {
    return !acc || Number(r.discountRate) > Number(acc.discountRate) ? r : acc;
  }, null);

  if (!best) return productDisc;

  const ruleRate = Number(best.discountRate || 0) || 0;
  if (best.overrideExisting) return ruleRate;

  // override=false ise ürünün indirimi varsa onu koru, yoksa kuralı uygula
  return productDisc > 0 ? productDisc : ruleRate;
};

const _decorateWithEffective = (product, rules) => {
  const matched = rules.filter((r) => _matchesRule(r, product));
  const rate = _computeEffectiveDiscount(product, matched);
  const price = Number(product.price || 0);
  const effectivePrice =
    rate > 0 ? Math.max(0, Number(((price * (100 - rate)) / 100).toFixed(2))) : price;

  return { effectiveDiscount: rate, effectivePrice };
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
      color: color || "",
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
    // /products?varyantsOf=BASE_ID → base + child renkler
    if (req.query.varyantsOf) {
      const baseId = req.query.varyantsOf;
      const products = await Product.find({
        $or: [{ _id: baseId }, { parentProductId: baseId }],
      }).select("color _id name");
      return res.json(products);
    }

    // normal listeleme
    const products = await Product.find()
      .select(
        "name video images price originalPrice discount sizes color category"
      )
      .populate({
        path: "category",
        select: "name image parent",
        populate: { path: "parent", select: "name" },
      });

    // aktif kuralları al ve ürünlere uygula
    const rules = await _getActiveRules();
    const out = products.map((doc) => {
      const p = doc.toObject(); // shape'i bozmadan plain objeye çevir
      const { effectiveDiscount, effectivePrice } = _decorateWithEffective(p, rules);
      return { ...p, effectiveDiscount, effectivePrice };
    });

    res.json(out);
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
    const productDoc = await Product.findById(req.params.id)
      .select(
        "video images price originalPrice discount category sizes description color name parentProductId"
      )
      .populate({
        path: "category",
        select: "name image parent",
        populate: { path: "parent", select: "name" },
      });

    if (!productDoc)
      return res.status(404).json({ message: "Ürün bulunamadı." });

    const product = productDoc.toObject();
    const rules = await _getActiveRules();
    const { effectiveDiscount, effectivePrice } = _decorateWithEffective(
      product,
      rules
    );

    res.json({ ...product, effectiveDiscount, effectivePrice });
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
      return res.status(400).json({ message: "Ürün adı zorunludur." });
    }

    // Kategori doğrulaması (opsiyonel)
    if (category && !(await Category.exists({ _id: category }))) {
      return res.status(400).json({ message: "Geçersiz kategori." });
    }

    // Dosyalar
    const newVideo = req.files?.video?.[0]?.path;
    const newImages = req.files?.images?.map((f) => f.path) || [];

    // Güncellenecek alanlar
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
    const baseId = req.params.baseProductId;
    const { color, sizes, price, originalPrice, discount, description, name } =
      req.body;

    if (!color || !color.trim())
      return res.status(400).json({ message: "Renk zorunludur." });

    const base = await Product.findById(baseId);
    if (!base) return res.status(404).json({ message: "Ana ürün bulunamadı." });

    // Aynı renkten zaten var mı?
    const duplicate = await Product.findOne({
      $or: [{ _id: baseId }, { parentProductId: baseId }],
      color: { $regex: new RegExp("^" + color.trim() + "$", "i") },
    });
    if (duplicate)
      return res.status(409).json({ message: "Bu renkte varyant zaten var." });

    // Medya (yeni gelmişse onu kullan; yoksa base'ten miras al)
    const video = req.files?.video?.[0]?.path || base.video;
    const images = req.files?.images?.map((f) => f.path) || base.images;

    if (!video || images.length === 0)
      return res
        .status(400)
        .json({ message: "Video ve en az bir resim yüklenmelidir." });

    // Yeni ürün
    const newProduct = await Product.create({
      name: name ?? base.name,
      price: price ?? base.price,
      originalPrice: originalPrice ?? base.originalPrice,
      discount: discount ?? base.discount,
      description: description ?? base.description,
      category: base.category,
      parentProductId: base._id,
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