const Product = require("../models/Product");
const ShippingMethod = require("../models/ShippingMethod");
const CartCampaign = require("../models/CartCampaign");

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function round2(n) {
  return Math.round(Number(n || 0) * 100) / 100;
}

function normalizeSize(size) {
  if (size === null || size === undefined) return "";
  return String(size).trim();
}

function nowInRange(startAt, endAt, now = new Date()) {
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();
  const ts = now.getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return false;
  return start <= ts && ts <= end;
}

function buildAggregatedItems(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new HttpError(400, "Sepet boş veya geçersiz.");
  }

  const aggregated = new Map();

  rawItems.forEach((item) => {
    const id = String(item?.id || item?.productId || "").trim();
    if (!id) throw new HttpError(400, "Geçersiz ürün (id eksik).");

    const qty = Number(item?.qty);
    if (!Number.isFinite(qty) || qty <= 0) {
      throw new HttpError(400, "Geçersiz adet değeri.");
    }
    const normalizedQty = Math.floor(qty);
    if (normalizedQty <= 0) {
      throw new HttpError(400, "Geçersiz adet değeri.");
    }

    const sizeKey = normalizeSize(item?.size);
    const key = `${id}:::${sizeKey}`;
    if (!aggregated.has(key)) {
      aggregated.set(key, {
        id,
        size: sizeKey,
        qty: normalizedQty,
        color: item?.color ?? null,
      });
    } else {
      aggregated.get(key).qty += normalizedQty;
    }
  });

  return aggregated;
}

function sumCheapestUnits(lines, neededUnits, useOriginal = false) {
  let remaining = Math.floor(Number(neededUnits || 0));
  if (remaining <= 0) return 0;

  const buckets = lines
    .map((line) => ({
      unitPrice: useOriginal ? Number(line.originalPrice || 0) : Number(line.price || 0),
      qty: Number(line.qty || 0),
    }))
    .filter((b) => Number.isFinite(b.unitPrice) && b.unitPrice >= 0 && b.qty > 0)
    .sort((a, b) => a.unitPrice - b.unitPrice);

  let total = 0;
  for (const bucket of buckets) {
    if (remaining <= 0) break;
    const take = Math.min(remaining, bucket.qty);
    total += take * bucket.unitPrice;
    remaining -= take;
  }

  return round2(total);
}

function computePercentDiscount({
  currentSubtotal,
  originalSubtotal,
  discountPercent,
  stackWithCatalogDiscount,
}) {
  const current = Number(currentSubtotal || 0);
  const original = Number(originalSubtotal || 0);
  const percent = Number(discountPercent || 0);

  if (!Number.isFinite(current) || current <= 0) return 0;
  if (!Number.isFinite(percent) || percent <= 0) return 0;

  if (stackWithCatalogDiscount) {
    return round2((current * percent) / 100);
  }

  // Kampanya "üstüne binmesin" ise, katalog indirimi dikkate alınmadan
  // kampanya tek başına uygulanmış olsaydı oluşacak toplamı hedefler.
  const campaignOnlyTotal = round2(original * (1 - percent / 100));
  return round2(Math.max(0, current - campaignOnlyTotal));
}

function evaluateCampaignForLines(campaign, lines) {
  const coveredSet = new Set((campaign.productIds || []).map((id) => String(id)));
  const coveredLines = lines.filter((line) => coveredSet.has(String(line.productId)));
  if (!coveredLines.length) return null;

  const coveredQty = coveredLines.reduce((sum, line) => sum + Number(line.qty || 0), 0);
  const coveredSubtotal = round2(
    coveredLines.reduce(
      (sum, line) => sum + Number(line.price || 0) * Number(line.qty || 0),
      0
    )
  );
  const coveredOriginalSubtotal = round2(
    coveredLines.reduce(
      (sum, line) =>
        sum + Number(line.originalPrice || line.price || 0) * Number(line.qty || 0),
      0
    )
  );

  const stackWithCatalogDiscount =
    campaign.templateType === "buy_x_get_y_free"
      ? true
      : campaign.stackWithCatalogDiscount !== false;

  let savings = 0;
  let details = {};

  if (campaign.templateType === "buy_x_get_y_free") {
    const xQty = Number(campaign.rules?.xQty || 0);
    const yQty = Number(campaign.rules?.yQty || 0);
    if (xQty < 1 || yQty < 1) return null;

    const cycle = xQty + yQty;
    const cycleCount = Math.floor(coveredQty / cycle);
    const freeUnits = cycleCount * yQty;
    if (freeUnits <= 0) return null;

    savings = sumCheapestUnits(coveredLines, freeUnits, false);
    details = {
      xQty,
      yQty,
      cycle,
      cycleCount,
      freeUnits,
      coveredQty,
    };
  } else if (campaign.templateType === "buy_x_get_percent") {
    const xQty = Number(campaign.rules?.xQty || 0);
    const discountPercent = Number(campaign.rules?.discountPercent || 0);
    if (xQty < 1 || discountPercent <= 0) return null;
    if (coveredQty < xQty) return null;

    savings = computePercentDiscount({
      currentSubtotal: coveredSubtotal,
      originalSubtotal: coveredOriginalSubtotal,
      discountPercent,
      stackWithCatalogDiscount,
    });
    details = {
      xQty,
      discountPercent,
      coveredQty,
      coveredSubtotal,
    };
  } else if (campaign.templateType === "spend_x_get_percent") {
    const thresholdAmount = Number(campaign.rules?.thresholdAmount || 0);
    const discountPercent = Number(campaign.rules?.discountPercent || 0);
    if (thresholdAmount <= 0 || discountPercent <= 0) return null;
    if (coveredSubtotal < thresholdAmount) return null;

    savings = computePercentDiscount({
      currentSubtotal: coveredSubtotal,
      originalSubtotal: coveredOriginalSubtotal,
      discountPercent,
      stackWithCatalogDiscount,
    });
    details = {
      thresholdAmount,
      discountPercent,
      coveredSubtotal,
    };
  } else {
    return null;
  }

  savings = round2(Math.max(0, Math.min(savings, coveredSubtotal)));
  if (savings <= 0) return null;

  return {
    campaignId: campaign._id,
    name: campaign.name,
    templateType: campaign.templateType,
    stackWithCatalogDiscount,
    headerPlacement: campaign.headerPlacement || "none",
    savings,
    details,
  };
}

async function getEligibleCampaigns(lines, now = new Date()) {
  const productIdsInCart = Array.from(
    new Set(lines.map((line) => String(line.productId)))
  );
  if (!productIdsInCart.length) return [];

  const campaigns = await CartCampaign.find({
    isEnabled: true,
    startAt: { $lte: now },
    endAt: { $gte: now },
    productIds: { $in: productIdsInCart },
  })
    .sort({ createdAt: 1 })
    .lean();

  return campaigns
    .filter((c) => nowInRange(c.startAt, c.endAt, now))
    .map((campaign) => evaluateCampaignForLines(campaign, lines))
    .filter(Boolean);
}

function selectCampaign(eligibleCampaigns, selectedCampaignId) {
  if (!selectedCampaignId) {
    return null;
  }

  const found = eligibleCampaigns.find(
    (item) => String(item.campaignId) === String(selectedCampaignId)
  );
  if (!found) {
    throw new HttpError(
      409,
      "Seçilen kampanya sepet koşullarını artık sağlamıyor."
    );
  }
  return found;
}

async function calculateCartPricing(rawItems, options = {}) {
  const selectedCampaignId = options?.selectedCampaignId
    ? String(options.selectedCampaignId)
    : "";
  const includeEligibleCampaigns = options?.includeEligibleCampaigns !== false;
  const now = options?.now instanceof Date ? options.now : new Date();

  const aggregated = buildAggregatedItems(rawItems);

  const productIds = Array.from(
    new Set(Array.from(aggregated.values()).map((it) => it.id))
  );
  const products = await Product.find({ _id: { $in: productIds } })
    .select("name price originalPrice sizes color")
    .lean();
  const productMap = new Map(products.map((p) => [String(p._id), p]));

  let subTotal = 0;
  const orderItems = [];

  for (const entry of aggregated.values()) {
    const product = productMap.get(entry.id);
    if (!product) {
      throw new HttpError(400, "Sepetteki ürün bulunamadı.");
    }

    const unitPrice = Number(product.price);
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      throw new HttpError(400, `Ürünün fiyatı geçersiz: ${product.name}`);
    }

    const unitOriginalPrice = Number(product.originalPrice);
    const normalizedOriginalPrice =
      Number.isFinite(unitOriginalPrice) && unitOriginalPrice > 0
        ? unitOriginalPrice
        : unitPrice;

    const sizes = Array.isArray(product.sizes) ? product.sizes : [];
    const sizeRecord = sizes.find((s) => normalizeSize(s?.size) === entry.size);

    if (!sizeRecord) {
      throw new HttpError(409, `Seçilen beden stokta yok: ${product.name}`);
    }

    const available = Number(sizeRecord.stock || 0);
    if (entry.qty > available) {
      throw new HttpError(409, `Yetersiz stok: ${product.name}`);
    }

    subTotal += unitPrice * entry.qty;
    orderItems.push({
      productId: product._id,
      name: product.name,
      price: unitPrice,
      originalPrice: normalizedOriginalPrice,
      qty: entry.qty,
      size: sizeRecord.size || "",
      color: entry.color ?? product.color ?? "",
    });
  }

  subTotal = round2(subTotal);

  const eligibleCampaigns = includeEligibleCampaigns
    ? await getEligibleCampaigns(orderItems, now)
    : [];
  const appliedCampaign = includeEligibleCampaigns
    ? selectCampaign(eligibleCampaigns, selectedCampaignId)
    : null;

  const campaignDiscount = round2(appliedCampaign?.savings || 0);
  const discountedSubTotal = round2(Math.max(0, subTotal - campaignDiscount));

  const shippingMethod = await ShippingMethod.findOne()
    .sort({ createdAt: -1 })
    .lean();

  let shippingFee = 0;
  let shippingName = null;
  let freeShippingThreshold = null;
  if (shippingMethod) {
    shippingName = shippingMethod.name || null;
    const baseFee = Number(shippingMethod.fee || 0);
    const threshold =
      shippingMethod.freeShippingThreshold === null ||
      shippingMethod.freeShippingThreshold === undefined
        ? null
        : Number(shippingMethod.freeShippingThreshold);
    const qualifiesForFree =
      threshold !== null && Number.isFinite(threshold) && subTotal >= threshold;
    shippingFee = qualifiesForFree ? 0 : baseFee;
    if (threshold !== null && Number.isFinite(threshold)) {
      freeShippingThreshold = threshold;
    }
  }

  shippingFee = round2(shippingFee);
  const grandTotal = round2(discountedSubTotal + shippingFee);

  return {
    items: orderItems.map((it) => ({
      ...it,
      productId: it.productId,
    })),
    eligibleCampaigns: eligibleCampaigns.map((campaign) => ({
      campaignId: campaign.campaignId,
      name: campaign.name,
      templateType: campaign.templateType,
      savings: campaign.savings,
      details: campaign.details,
    })),
    appliedCampaign: appliedCampaign
      ? {
          campaignId: appliedCampaign.campaignId,
          name: appliedCampaign.name,
          templateType: appliedCampaign.templateType,
          savings: appliedCampaign.savings,
          details: appliedCampaign.details,
        }
      : null,
    summary: {
      subTotal,
      campaignDiscount,
      discountedSubTotal,
      shippingFee,
      shippingName,
      grandTotal,
      isFree: shippingFee === 0,
      freeShippingThreshold,
    },
  };
}

module.exports = {
  HttpError,
  calculateCartPricing,
  nowInRange,
};
