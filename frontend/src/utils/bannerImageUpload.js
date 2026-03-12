import heic2any from "heic2any";

const DEFAULT_MAX_BYTES = 10 * 1024 * 1024;
const DEFAULT_MAX_WIDTH = 1920;
const DEFAULT_MAX_HEIGHT = 600;
const DEFAULT_START_QUALITY = 0.9;
const DEFAULT_MIN_QUALITY = 0.68;

const DIRECT_IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);
const HEIC_MIMES = new Set(["image/heic", "image/heif"]);
const DIRECT_IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);
const HEIC_EXTENSIONS = new Set(["heic", "heif"]);

const getExtension = (name = "") => {
  const normalized = String(name).toLowerCase().trim();
  const parts = normalized.split(".");
  return parts.length > 1 ? parts.pop() : "";
};

export const isHeicLikeFile = (file) => {
  const mime = (file?.type || "").toLowerCase();
  const ext = getExtension(file?.name);
  if (HEIC_MIMES.has(mime) || HEIC_EXTENSIONS.has(ext)) return true;
  return (
    (mime === "" || mime === "application/octet-stream") &&
    HEIC_EXTENSIONS.has(ext)
  );
};

const isReadableImageFile = (file) => {
  const mime = (file?.type || "").toLowerCase();
  const ext = getExtension(file?.name);
  if (DIRECT_IMAGE_MIMES.has(mime) || HEIC_MIMES.has(mime)) return true;
  if (DIRECT_IMAGE_EXTENSIONS.has(ext) || HEIC_EXTENSIONS.has(ext)) return true;
  return (
    (mime === "" || mime === "application/octet-stream") &&
    (DIRECT_IMAGE_EXTENSIONS.has(ext) || HEIC_EXTENSIONS.has(ext))
  );
};

const withExtension = (name = "image", ext = "jpg") => {
  const base = String(name).replace(/\.[^.]+$/, "") || "image";
  return `${base}.${ext}`;
};

const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Görsel yüklenemedi."));
    };
    img.src = objectUrl;
  });

const canvasToBlob = (canvas, type, quality) =>
  new Promise((resolve, reject) => {
    const done = (blob) => {
      if (!blob) {
        reject(new Error("Görsel dönüştürülemedi."));
        return;
      }
      resolve(blob);
    };
    if (typeof quality === "number") {
      canvas.toBlob(done, type, quality);
      return;
    }
    canvas.toBlob(done, type);
  });

const toFile = (blob, name, type, lastModified = Date.now()) =>
  new File([blob], name, { type, lastModified });

const convertHeicToJpeg = async (file) => {
  const result = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.92,
  });
  const blob = Array.isArray(result) ? result[0] : result;
  return toFile(blob, withExtension(file.name, "jpg"), "image/jpeg", file.lastModified);
};

const buildCanvas = (img, width, height) => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas hazırlanamadı.");
  }
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
};

const compressJpegWithinLimit = async (
  canvas,
  { maxBytes, startQuality, minQuality }
) => {
  let quality = startQuality;
  let blob = await canvasToBlob(canvas, "image/jpeg", quality);

  while (blob.size > maxBytes && quality > minQuality) {
    quality = Math.max(minQuality, +(quality - 0.08).toFixed(2));
    blob = await canvasToBlob(canvas, "image/jpeg", quality);
  }

  if (blob.size > maxBytes) {
    const scaleRatio = Math.sqrt(maxBytes / blob.size) * 0.97;
    const nextWidth = Math.max(1, Math.round(canvas.width * scaleRatio));
    const nextHeight = Math.max(1, Math.round(canvas.height * scaleRatio));
    if (nextWidth !== canvas.width || nextHeight !== canvas.height) {
      const scaledCanvas = document.createElement("canvas");
      scaledCanvas.width = nextWidth;
      scaledCanvas.height = nextHeight;
      const scaledCtx = scaledCanvas.getContext("2d");
      if (!scaledCtx) throw new Error("Canvas hazırlanamadı.");
      scaledCtx.fillStyle = "#ffffff";
      scaledCtx.fillRect(0, 0, nextWidth, nextHeight);
      scaledCtx.drawImage(canvas, 0, 0, nextWidth, nextHeight);
      return compressJpegWithinLimit(scaledCanvas, {
        maxBytes,
        startQuality: quality,
        minQuality,
      });
    }
  }

  if (blob.size > maxBytes) {
    throw new Error(
      "Görsel optimize edildi ancak hâlâ çok büyük. Lütfen daha küçük bir dosya seçin."
    );
  }

  return { blob, quality, width: canvas.width, height: canvas.height };
};

export async function prepareBannerImageUpload(file, options = {}) {
  if (!(file instanceof File)) {
    throw new Error("Geçersiz dosya seçimi.");
  }

  if (!isReadableImageFile(file)) {
    throw new Error(
      "Sadece JPG, PNG, WEBP veya Apple Fotoğraflar görselleri yükleyin."
    );
  }

  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const maxWidth = options.maxWidth ?? DEFAULT_MAX_WIDTH;
  const maxHeight = options.maxHeight ?? DEFAULT_MAX_HEIGHT;
  const startQuality = options.startQuality ?? DEFAULT_START_QUALITY;
  const minQuality = options.minQuality ?? DEFAULT_MIN_QUALITY;

  const originalType = (file.type || "").toLowerCase();
  const originalWasHeic = isHeicLikeFile(file);

  let sourceFile = file;
  if (originalWasHeic) {
    try {
      sourceFile = await convertHeicToJpeg(file);
    } catch {
      throw new Error(
        "Apple Fotoğraflar biçimi dönüştürülemedi. Lütfen farklı bir görsel deneyin."
      );
    }
  }

  let img;
  try {
    img = await loadImage(sourceFile);
  } catch {
    throw new Error(
      "Görsel tarayıcıda açılamadı. Lütfen farklı bir dosya seçin."
    );
  }

  const ratio = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
  const targetWidth = Math.max(1, Math.round(img.width * ratio));
  const targetHeight = Math.max(1, Math.round(img.height * ratio));

  const needsResize = targetWidth !== img.width || targetHeight !== img.height;
  const normalizedType = (sourceFile.type || "").toLowerCase();
  const needsFormatNormalization =
    originalWasHeic ||
    normalizedType === "image/webp" ||
    normalizedType === "" ||
    normalizedType === "application/octet-stream";
  const needsSizeOptimization = sourceFile.size > maxBytes;
  const needsOptimization =
    needsResize || needsFormatNormalization || needsSizeOptimization;

  if (!needsOptimization) {
    return {
      file: sourceFile,
      previewUrl: URL.createObjectURL(sourceFile),
      width: img.width,
      height: img.height,
      optimized: false,
      convertedFromApple: false,
      outputType: sourceFile.type,
      originalType,
    };
  }

  const canvas = buildCanvas(img, targetWidth, targetHeight);

  let outputBlob;
  let outputType = normalizedType || "image/jpeg";
  let quality = null;

  if (outputType === "image/png" && !needsFormatNormalization) {
    const pngBlob = await canvasToBlob(canvas, "image/png");
    if (pngBlob.size <= maxBytes) {
      outputBlob = pngBlob;
      outputType = "image/png";
    }
  }

  if (!outputBlob) {
    const compressed = await compressJpegWithinLimit(canvas, {
      maxBytes,
      startQuality,
      minQuality,
    });
    outputBlob = compressed.blob;
    outputType = "image/jpeg";
    quality = compressed.quality;
  }

  const outputFile = toFile(
    outputBlob,
    withExtension(sourceFile.name, outputType === "image/png" ? "png" : "jpg"),
    outputType,
    sourceFile.lastModified
  );

  return {
    file: outputFile,
    previewUrl: URL.createObjectURL(outputBlob),
    width: targetWidth,
    height: targetHeight,
    optimized: true,
    convertedFromApple: originalWasHeic,
    outputType,
    originalType,
    quality,
  };
}
