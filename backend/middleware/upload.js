const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const IMAGE_FILE_SIZE_LIMIT = 10 * 1024 * 1024;
const ALLOWED_IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

function getExtension(filename = "") {
  const normalized = String(filename).toLowerCase().trim();
  const parts = normalized.split(".");
  return parts.length > 1 ? parts.pop() : "";
}

function isAllowedImageFile(file) {
  const mime = (file?.mimetype || "").toLowerCase();
  const ext = getExtension(file?.originalname);

  if (ALLOWED_IMAGE_MIMES.has(mime)) return true;
  if (ALLOWED_IMAGE_EXTENSIONS.has(ext)) return true;
  return (
    (mime === "" || mime === "application/octet-stream") &&
    ALLOWED_IMAGE_EXTENSIONS.has(ext)
  );
}

function imageFileFilter(req, file, cb) {
  if (isAllowedImageFile(file)) {
    cb(null, true);
    return;
  }

  const err = new Error(
    "Desteklenmeyen görsel formatı. Lütfen JPG, PNG veya WEBP yükleyin."
  );
  err.statusCode = 400;
  err.code = "UNSUPPORTED_IMAGE_FORMAT";
  cb(err);
}

function createImageUpload(storage, maxSize = IMAGE_FILE_SIZE_LIMIT) {
  return multer({
    storage,
    fileFilter: imageFileFilter,
    limits: { fileSize: maxSize },
  });
}

function buildUploadError(err) {
  if (!err) return null;

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return {
        statusCode: 400,
        message: "Görsel boyutu çok büyük. Lütfen 10MB altında bir dosya yükleyin.",
      };
    }

    return {
      statusCode: 400,
      message: "Görsel yüklenemedi. Dosya tipini ve boyutunu kontrol edin.",
    };
  }

  if (err.statusCode) {
    return {
      statusCode: err.statusCode,
      message: err.message || "Görsel yüklenemedi.",
    };
  }

  const rawMessage = String(err.message || "").trim();
  const loweredMessage = rawMessage.toLowerCase();

  if (
    loweredMessage.includes("invalid image") ||
    loweredMessage.includes("unsupported image") ||
    loweredMessage.includes("unsupported file") ||
    loweredMessage.includes("resource_type") ||
    loweredMessage.includes("file size too large") ||
    loweredMessage.includes("could not be processed")
  ) {
    return {
      statusCode: 400,
      message:
        "Görsel yüklenemedi. Lütfen farklı bir JPG, PNG veya WEBP dosyası deneyin.",
    };
  }

  return {
    statusCode: 502,
    message: "Görsel servisine ulaşılamadı. Lütfen tekrar deneyin.",
  };
}

function withUploadGuard(uploadMiddleware) {
  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (!err) {
        next();
        return;
      }

      const safeError = buildUploadError(err);
      res.status(safeError.statusCode).json({ message: safeError.message });
    });
  };
}

// — Ürün resim/video upload (mevcut) —
const productStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isVideo = file.mimetype.startsWith("video/");
    return {
      folder: isVideo ? "products/videos" : "products/images",
      resource_type: isVideo ? "video" : "image",
      format: isVideo ? "mp4" : "jpg",
      public_id: `${isVideo ? "video" : "img"}_${Date.now()}`,
    };
  },
});
const uploadProductFiles = multer({ storage: productStorage });

// — Kategori resmi upload (mevcut) —
const categoryStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "categories",
    resource_type: "image",
    format: async () => "png",
  },
});
const uploadCategoryImage = createImageUpload(categoryStorage);

// — Kampanya resmi upload (mevcut) —
const campaignStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "campaigns",
    resource_type: "image",
    public_id: () => `campaign_${Date.now()}`,
  },
});
const uploadCampaignImage = createImageUpload(campaignStorage);

// — Mini kampanya resmi upload (mevcut) —
const miniCampaignStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "mini-campaigns",
    resource_type: "image",
    public_id: () => `mini_campaign_${Date.now()}`,
  },
});
const uploadMiniCampaignImage = createImageUpload(miniCampaignStorage);

// — Blog cover resmi upload (mevcut) —
const blogCoverStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "blog/covers",
    resource_type: "image",
    format: async () => "png",
  },
});
const uploadBlogCover = createImageUpload(blogCoverStorage);

// — Kullanıcı profil resmi upload (yeni) —
const profilePictureStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "user_profile_pictures",
    resource_type: "image",
    format: async () => "png",
    public_id: (req, file) => `profile_${req.user.userId}_${Date.now()}`,
  },
});
const uploadProfilePicture = createImageUpload(profilePictureStorage);

// — Hero video upload (yeni) —
const heroMediaStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const mime = file.mimetype || "";
    const isImage = mime.startsWith("image/");
    const isVideo = mime.startsWith("video/");

    if (!isImage && !isVideo) {
      throw new Error("Sadece video veya görsel yükleyin.");
    }

    return {
      folder: isImage ? "hero/images" : "hero/videos",
      resource_type: isImage ? "image" : "video",
      // Görsellerde orijinal formatı koru (jpg/png/webp vs.), videoda mp4’e sabitle
      format: isImage ? undefined : "mp4",
      public_id: `${isImage ? "hero_img" : "hero_vid"}_${Date.now()}`,
    };
  },
});
const uploadHeroVideo = multer({ storage: heroMediaStorage });

// Hepsini export ediyoruz
module.exports = {
  uploadProductFiles,
  uploadCategoryImage,
  uploadCampaignImage,
  uploadMiniCampaignImage,
  uploadBlogCover,
  uploadProfilePicture,
  uploadHeroVideo,
  withUploadGuard,
};
