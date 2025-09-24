const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

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
const uploadCategoryImage = multer({ storage: categoryStorage });

// — Kampanya resmi upload (mevcut) —
const campaignStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "campaigns",
    resource_type: "image",
    format: async () => "png",
  },
});
const uploadCampaignImage = multer({ storage: campaignStorage });

// — Mini kampanya resmi upload (mevcut) —
const miniCampaignStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "mini-campaigns",
    resource_type: "image",
    format: async () => "png",
  },
});
const uploadMiniCampaignImage = multer({ storage: miniCampaignStorage });

// — Blog cover resmi upload (mevcut) —
const blogCoverStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "blog/covers",
    resource_type: "image",
    format: async () => "png",
  },
});
const uploadBlogCover = multer({ storage: blogCoverStorage });

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
const uploadProfilePicture = multer({ storage: profilePictureStorage });

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
};
