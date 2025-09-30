const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const DEFAULT_MAX_DIMENSION = 1920;
const QUALITY_STEP = 0.1;
const SCALE_STEP = 0.85;
const MIN_SCALE = 0.3;
const INITIAL_QUALITY = 0.92;
const MIN_QUALITY = 0.4;

const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };
    img.src = objectUrl;
  });

const canvasToBlob = (img, { scale, type, quality }) =>
  new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Canvas context not available"));
      return;
    }
    ctx.drawImage(img, 0, 0, width, height);
    const callback = (blob) => {
      if (!blob) reject(new Error("Compression failed"));
      else resolve(blob);
    };
    if (type === "image/jpeg" || type === "image/webp") {
      canvas.toBlob(callback, type, quality);
    } else {
      canvas.toBlob(callback, type);
    }
  });

const withSuffix = (filename, suffix) => {
  const parts = filename.split(".");
  if (parts.length < 2) return `${filename}${suffix}`;
  const ext = parts.pop();
  return `${parts.join(".")}${suffix}.${ext}`;
};

export async function compressImageFile(file, options = {}) {
  if (!(file instanceof File) || !file.type.startsWith("image/")) {
    return { file, compressed: false, skipped: true };
  }

  const maxBytes = options.maxBytes ?? MAX_IMAGE_BYTES;
  if (file.size <= maxBytes) {
    return { file, compressed: false };
  }

  const maxDimension = options.maxDimension ?? DEFAULT_MAX_DIMENSION;
  const img = await loadImage(file);

  let scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
  if (!Number.isFinite(scale) || scale <= 0) scale = 1;

  let quality = INITIAL_QUALITY;
  const type = file.type;
  const supportsQuality = type === "image/jpeg" || type === "image/webp";

  const attempt = async () =>
    canvasToBlob(img, { scale, type, quality: supportsQuality ? quality : undefined });

  let blob = await attempt();
  let iterations = 0;

  while (blob.size > maxBytes && iterations < 12) {
    iterations += 1;
    if (supportsQuality && quality > MIN_QUALITY) {
      quality = Math.max(MIN_QUALITY, quality - QUALITY_STEP);
    } else if (scale > MIN_SCALE) {
      scale *= SCALE_STEP;
      quality = INITIAL_QUALITY;
    } else {
      break;
    }
    blob = await attempt();
  }

  if (blob.size > maxBytes) {
    return { file: null, compressed: false, exceeded: true };
  }

  const compressedFile = new File([blob], withSuffix(file.name, "-compressed"), {
    type,
    lastModified: file.lastModified,
  });

  return { file: compressedFile, compressed: true };
}

export async function compressImageFileList(fileList, options = {}) {
  const files = Array.from(fileList || []);
  const processed = [];
  const failed = [];

  for (const original of files) {
    try {
      const result = await compressImageFile(original, options);
      if (result.file) {
        processed.push(result.file);
      } else if (result.exceeded) {
        failed.push({ name: original.name, size: original.size });
      }
    } catch (err) {
      failed.push({ name: original.name, size: original.size, error: err });
    }
  }

  return { processed, failed };
}

export { MAX_IMAGE_BYTES };
