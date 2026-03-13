const CLOUDINARY_UPLOAD_SEGMENT = "/upload/";
const DEFAULT_TRANSFORMS = ["f_auto", "q_auto:good", "dpr_auto"];

export function isCloudinaryUrl(url) {
  return typeof url === "string" && url.includes("res.cloudinary.com") && url.includes(CLOUDINARY_UPLOAD_SEGMENT);
}

export function buildCloudinaryImageUrl(url, options = {}) {
  if (!isCloudinaryUrl(url)) return url || "";

  const {
    width,
    height,
    crop,
    aspectRatio,
    gravity,
    quality = "auto:good",
    format = "auto",
    dpr = "auto",
  } = options;

  const transforms = [];

  if (format) transforms.push(`f_${format}`);
  if (quality) transforms.push(`q_${quality}`);
  if (dpr) transforms.push(`dpr_${dpr}`);
  if (crop) transforms.push(`c_${crop}`);
  if (aspectRatio) transforms.push(`ar_${aspectRatio}`);
  if (gravity) transforms.push(`g_${gravity}`);
  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);

  const normalizedTransforms = transforms.length ? transforms : DEFAULT_TRANSFORMS;
  return url.replace(CLOUDINARY_UPLOAD_SEGMENT, `${CLOUDINARY_UPLOAD_SEGMENT}${normalizedTransforms.join(",")}/`);
}

export function getResponsiveImageProps(url, options = {}) {
  const {
    widths = [320, 480, 640, 768],
    defaultWidth,
    sizes = "100vw",
    ...transformOptions
  } = options;

  if (!isCloudinaryUrl(url)) {
    return {
      src: url || "",
      srcSet: undefined,
      sizes,
    };
  }

  const usableWidths = widths.filter((value) => Number(value) > 0);
  const fallbackWidth = defaultWidth || usableWidths[usableWidths.length - 1];

  return {
    src: buildCloudinaryImageUrl(url, {
      ...transformOptions,
      width: fallbackWidth,
    }),
    srcSet: usableWidths
      .map((width) => `${buildCloudinaryImageUrl(url, { ...transformOptions, width })} ${width}w`)
      .join(", "),
    sizes,
  };
}
