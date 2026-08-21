const Product = require("../models/Product");
const Category = require("../models/Category");
const { MediaError } = require("../services/media/errors");
const {
  CatalogValidationError,
  parseProductPricing,
  parseProductSizes,
  requiredText,
} = require("../services/catalogValidation");
const {
  applyProductMedia,
  legacyAssetUrl,
  parseAssetIds,
  removeOwnerMediaReferences,
  requireReadyAssets,
  syncOwnerMediaReferences,
} = require("../services/media/assets");

const PRODUCTS_CACHE_TTL = 60 * 1000;
let productsCache = { data: null, expiry: 0 };

function invalidateProductsCache() {
  productsCache = { data: null, expiry: 0 };
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function populateProductMedia(query) {
  return query
    .populate("imageAssets")
    .populate("videoAsset")
    .populate({
      path: "category",
      select: "name image imageAsset parent",
      populate: [
        { path: "parent", select: "name" },
        { path: "imageAsset" },
      ],
    });
}

async function resolveProductAssets(body, options = {}) {
  const imageAssets = await requireReadyAssets(body.imageAssetIds, {
    purpose: "product_image",
    kind: "image",
    min: options.imageMin ?? 1,
    max: 6,
  });
  const videoIds = parseAssetIds(body.videoAssetId);
  const videoAssets = await requireReadyAssets(videoIds, {
    purpose: "product_video",
    kind: "video",
    min: 0,
    max: 1,
  });
  return { imageAssets, videoAsset: videoAssets[0] || null };
}

async function syncProductReferences(product) {
  await syncOwnerMediaReferences({
    ownerType: "Product",
    ownerId: product._id,
    fields: {
      images: product.imageAssets || [],
      video: product.videoAsset ? [product.videoAsset] : [],
    },
  });
}

exports.createProduct = async (req, res) => {
  try {
    const { category, description, color } = req.body;
    const name = requiredText(req.body.name, "Ürün adı");
    const pricing = parseProductPricing(req.body);
    const sizes = parseProductSizes(req.body.sizes);
    if (!(await Category.exists({ _id: category }))) {
      return res.status(400).json({ message: "Geçersiz kategori." });
    }
    const { imageAssets, videoAsset } = await resolveProductAssets(req.body);
    const product = await Product.create({
      name,
      videoAsset: videoAsset?._id || null,
      imageAssets: imageAssets.map((asset) => asset._id),
      video: videoAsset ? legacyAssetUrl(videoAsset, "detail") : "",
      images: imageAssets.map((asset) => legacyAssetUrl(asset, "detail")),
      price: pricing.price,
      originalPrice: pricing.originalPrice,
      discount: pricing.discount,
      category,
      sizes,
      description: description || "",
      color: color || "",
      parentProductId: null,
    });
    await syncProductReferences(product);
    invalidateProductsCache();
    const populated = await populateProductMedia(Product.findById(product._id));
    res.status(201).json(applyProductMedia(populated));
  } catch (error) {
    if (error instanceof MediaError) throw error;
    if (error instanceof CatalogValidationError) {
      return res.status(400).json({ message: error.message, details: error.details });
    }
    console.error(error);
    res.status(500).json({ message: "Ürün oluşturulurken hata oluştu." });
  }
};

exports.getProducts = async (req, res) => {
  try {
    if (req.query.varyantsOf) {
      const baseId = req.query.varyantsOf;
      const products = await Product.find({
        $or: [{ _id: baseId }, { parentProductId: baseId }],
      }).select("color _id name");
      return res.json(products);
    }
    const now = Date.now();
    if (productsCache.data && now < productsCache.expiry) {
      return res.json(productsCache.data);
    }
    const products = await populateProductMedia(
      Product.find()
        .sort({ createdAt: -1 })
        .select(
          "name video images videoAsset imageAssets price originalPrice discount sizes color category parentProductId createdAt"
        )
    ).lean();
    const result = products.map((product) => applyProductMedia(product, "list"));
    productsCache = { data: result, expiry: Date.now() + PRODUCTS_CACHE_TTL };
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ürünler getirilirken hata oluştu." });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const product = await populateProductMedia(
      Product.findById(req.params.id).select(
        "video images videoAsset imageAssets price originalPrice discount category sizes description color name parentProductId"
      )
    );
    if (!product) return res.status(404).json({ message: "Ürün bulunamadı." });
    res.json(applyProductMedia(product, "detail"));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ürün getirilirken hata oluştu." });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const existing = await Product.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Ürün bulunamadı." });
    const name = requiredText(req.body.name, "Ürün adı");
    const pricing = parseProductPricing({
      price: req.body.price ?? existing.price,
      originalPrice: req.body.originalPrice ?? existing.originalPrice,
    });
    const sizes =
      req.body.sizes !== undefined
        ? parseProductSizes(req.body.sizes)
        : parseProductSizes(existing.sizes);
    if (req.body.category && !(await Category.exists({ _id: req.body.category }))) {
      return res.status(400).json({ message: "Geçersiz kategori." });
    }

    let imageAssets;
    if (req.body.imageAssetIds !== undefined) {
      imageAssets = await requireReadyAssets(req.body.imageAssetIds, {
        purpose: "product_image",
        kind: "image",
        min: 1,
        max: 6,
      });
    } else {
      imageAssets = await requireReadyAssets(existing.imageAssets, {
        purpose: "product_image",
        kind: "image",
        min: 1,
        max: 6,
      });
    }

    let videoAsset = null;
    if (req.body.videoAssetId === undefined) {
      if (existing.videoAsset) {
        [videoAsset] = await requireReadyAssets([existing.videoAsset], {
          purpose: "product_video",
          kind: "video",
          max: 1,
        });
      }
    } else {
      const videoIds = parseAssetIds(req.body.videoAssetId);
      const videos = await requireReadyAssets(videoIds, {
        purpose: "product_video",
        kind: "video",
        max: 1,
      });
      videoAsset = videos[0] || null;
    }

    existing.name = name;
    existing.price = pricing.price;
    existing.originalPrice = pricing.originalPrice;
    existing.discount = pricing.discount;
    existing.category = req.body.category || existing.category;
    existing.description =
      req.body.description !== undefined ? req.body.description : existing.description;
    existing.color = req.body.color !== undefined ? req.body.color : existing.color;
    existing.sizes = sizes;
    existing.imageAssets = imageAssets.map((asset) => asset._id);
    existing.videoAsset = videoAsset?._id || null;
    existing.images = imageAssets.map((asset) => legacyAssetUrl(asset, "detail"));
    existing.video = videoAsset ? legacyAssetUrl(videoAsset, "detail") : "";
    await existing.save();
    await syncProductReferences(existing);
    invalidateProductsCache();
    const populated = await populateProductMedia(Product.findById(existing._id));
    res.json(applyProductMedia(populated));
  } catch (error) {
    if (error instanceof MediaError) throw error;
    if (error instanceof CatalogValidationError) {
      return res.status(400).json({ message: error.message, details: error.details });
    }
    console.error(error);
    res.status(500).json({ message: "Ürün güncellenirken hata oluştu." });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const result = await Product.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: "Ürün bulunamadı." });
    await removeOwnerMediaReferences("Product", result._id);
    invalidateProductsCache();
    res.json({ message: "Ürün silindi. Kullanılmayan medyalar bakım alanından temizlenebilir." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ürün silinirken hata oluştu." });
  }
};

exports.createProductWithNewColor = async (req, res) => {
  try {
    const baseId = req.params.baseProductId;
    const color = String(req.body.color || "").trim();
    if (!color) return res.status(400).json({ message: "Renk zorunludur." });
    const base = await Product.findById(baseId);
    if (!base) return res.status(404).json({ message: "Ana ürün bulunamadı." });
    const name = requiredText(req.body.name ?? base.name, "Ürün adı");
    const pricing = parseProductPricing({
      price: req.body.price ?? base.price,
      originalPrice: req.body.originalPrice ?? base.originalPrice,
    });
    const sizes =
      req.body.sizes !== undefined
        ? parseProductSizes(req.body.sizes)
        : parseProductSizes(base.sizes);
    const duplicate = await Product.findOne({
      $or: [{ _id: baseId }, { parentProductId: baseId }],
      color: { $regex: new RegExp(`^${escapeRegex(color)}$`, "i") },
    });
    if (duplicate) return res.status(409).json({ message: "Bu renkte varyant zaten var." });

    let imageAssets;
    const requestedImages = parseAssetIds(req.body.imageAssetIds);
    if (requestedImages.length) {
      imageAssets = await requireReadyAssets(requestedImages, {
        purpose: "product_image",
        kind: "image",
        min: 1,
        max: 6,
      });
    } else {
      imageAssets = await requireReadyAssets(base.imageAssets, {
        purpose: "product_image",
        kind: "image",
        min: 1,
        max: 6,
      });
    }
    let videoAsset = null;
    const requestedVideo = parseAssetIds(req.body.videoAssetId);
    if (requestedVideo.length) {
      [videoAsset] = await requireReadyAssets(requestedVideo, {
        purpose: "product_video",
        kind: "video",
        max: 1,
      });
    } else if (base.videoAsset) {
      [videoAsset] = await requireReadyAssets([base.videoAsset], {
        purpose: "product_video",
        kind: "video",
        max: 1,
      });
    }

    const product = await Product.create({
      name,
      price: pricing.price,
      originalPrice: pricing.originalPrice,
      discount: pricing.discount,
      description: req.body.description ?? base.description,
      category: base.category,
      parentProductId: base._id,
      color,
      sizes,
      imageAssets: imageAssets.map((asset) => asset._id),
      videoAsset: videoAsset?._id || null,
      images: imageAssets.map((asset) => legacyAssetUrl(asset, "detail")),
      video: videoAsset ? legacyAssetUrl(videoAsset, "detail") : "",
    });
    await syncProductReferences(product);
    invalidateProductsCache();
    const populated = await populateProductMedia(Product.findById(product._id));
    res.status(201).json(applyProductMedia(populated));
  } catch (error) {
    if (error instanceof MediaError) throw error;
    if (error instanceof CatalogValidationError) {
      return res.status(400).json({ message: error.message, details: error.details });
    }
    console.error("Yeni renk ekleme hatası:", error);
    res.status(500).json({ message: "Yeni renk eklenirken beklenmeyen bir hata oluştu." });
  }
};
