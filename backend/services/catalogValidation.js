class CatalogValidationError extends Error {
  constructor(message, details = undefined) {
    super(message);
    this.name = "CatalogValidationError";
    this.statusCode = 400;
    this.details = details;
  }
}

function roundToTwo(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function requiredText(value, label, maxLength = 160) {
  const normalized = String(value || "").trim();
  if (!normalized) {
    throw new CatalogValidationError(`${label} zorunludur.`);
  }
  if (normalized.length > maxLength) {
    throw new CatalogValidationError(
      `${label} en fazla ${maxLength} karakter olabilir.`
    );
  }
  return normalized;
}

function finiteNumber(value, label) {
  if (value === "" || value === null || value === undefined) {
    throw new CatalogValidationError(`${label} zorunludur.`);
  }
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new CatalogValidationError(`${label} geçerli bir sayı olmalıdır.`);
  }
  return number;
}

function parseProductPricing(input = {}) {
  const originalPrice = roundToTwo(
    finiteNumber(input.originalPrice, "Orijinal fiyat")
  );
  const price = roundToTwo(finiteNumber(input.price, "Satış fiyatı"));

  if (originalPrice < 0 || price < 0) {
    throw new CatalogValidationError("Fiyatlar sıfırdan küçük olamaz.");
  }
  if (price > originalPrice) {
    throw new CatalogValidationError(
      "Satış fiyatı orijinal fiyattan yüksek olamaz."
    );
  }

  const discount =
    originalPrice > 0 && price < originalPrice
      ? roundToTwo(100 - (price / originalPrice) * 100)
      : 0;

  return { originalPrice, price, discount };
}

function parseArray(value, label) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Aşağıdaki kullanıcı mesajı döndürülür.
    }
  }
  throw new CatalogValidationError(`${label} okunamadı.`);
}

function parseProductSizes(raw) {
  const values = parseArray(raw, "Beden ve stok bilgileri");
  if (!values.length) {
    throw new CatalogValidationError(
      "En az bir beden/stok satırı ekleyin. Bedensiz ürün için tek stok seçeneğini kullanın."
    );
  }
  if (values.length > 30) {
    throw new CatalogValidationError("Bir üründe en fazla 30 beden satırı olabilir.");
  }

  const normalized = values.map((item, index) => {
    const size = String(item?.size || "").trim();
    const stock = Number(item?.stock);
    if (size.length > 40) {
      throw new CatalogValidationError(
        `${index + 1}. satırdaki beden adı en fazla 40 karakter olabilir.`
      );
    }
    if (!Number.isSafeInteger(stock) || stock < 0) {
      throw new CatalogValidationError(
        `${index + 1}. satırdaki stok sıfır veya daha büyük bir tam sayı olmalıdır.`
      );
    }
    return { size, stock };
  });

  if (normalized.some((item) => !item.size) && normalized.length !== 1) {
    throw new CatalogValidationError(
      "Bedensiz ürün yalnızca tek stok satırı içerebilir."
    );
  }

  const seen = new Set();
  for (const item of normalized) {
    const key = item.size.toLocaleLowerCase("tr-TR");
    if (seen.has(key)) {
      throw new CatalogValidationError(
        `Aynı beden birden fazla kez eklenemez${item.size ? `: ${item.size}` : ""}.`
      );
    }
    seen.add(key);
  }

  return normalized;
}

module.exports = {
  CatalogValidationError,
  parseProductPricing,
  parseProductSizes,
  requiredText,
};
