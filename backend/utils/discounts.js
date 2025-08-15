// backend/utils/discounts.js
const mongoose = require("mongoose");

let cache = {
  rules: [],
  expiresAt: 0,
};

const isDateActive = (rule, now = new Date()) => {
  const { startAt, endAt, isActive } = rule;
  if (!isActive) return false;
  if (startAt && new Date(startAt) > now) return false;
  if (endAt && new Date(endAt) < now) return false;
  return true;
};

const getActiveRules = async (DiscountRuleModel) => {
  const nowMs = Date.now();
  if (cache.expiresAt > nowMs) return cache.rules;

  const raw = await DiscountRuleModel.find({})
    .select("selectionType targetIds discountRate overrideExisting startAt endAt isActive title")
    .lean();

  const active = raw.filter((r) => isDateActive(r));
  // 15 sn cache (istersen ENV ile ayarlayabilirsin)
  cache = { rules: active, expiresAt: nowMs + 15_000 };
  return active;
};

const clearDiscountCache = () => {
  cache = { rules: [], expiresAt: 0 };
};

const matchesRule = (rule, product) => {
  // product: { _id, category:{ _id, parent? }, ... }
  const targets = new Set((rule.targetIds || []).map((x) => String(x)));
  const pid = String(product._id);
  const catId = product.category?._id ? String(product.category._id) : String(product.category || "");
  const parentId = product.category?.parent?._id
    ? String(product.category.parent._id)
    : product.category?.parent
    ? String(product.category.parent)
    : "";

  if (rule.selectionType === "product") {
    return targets.has(pid);
  }
  if (rule.selectionType === "subcategory") {
    // direkt alt kategori id’si ürünün category’si ise eşleşir
    return catId && targets.has(catId);
  }
  if (rule.selectionType === "category") {
    // kök kategori: ya ürünün category’si bu id, ya da parent’ı bu id
    return (catId && targets.has(catId)) || (parentId && targets.has(parentId));
  }
  return false;
};

/**
 * Ürünün “kendi indirimi” ile rule indiriminin nasıl birleşeceği:
 * - overrideExisting === true  → kural indirimi, ürünün mevcut indirimini EZER.
 * - overrideExisting === false → ürünün kendi indirimi varsa onu KORUR; yoksa kural uygulanır.
 * Birden çok kural eşleşirse en yüksek indirimi tercih ediyoruz (mantıklı varsayılan).
 */
const computeEffectiveDiscount = (product, matchedRules) => {
  const base = Number(product.discountRate || product.discount || 0) || 0;

  if (!matchedRules.length) return base;

  // kural indirimi: en yükseği bul
  const bestRule = matchedRules.reduce(
    (best, r) => (!best || Number(r.discountRate) > Number(best.discountRate) ? r : best),
    null
  );

  if (!bestRule) return base;

  const ruleRate = Number(bestRule.discountRate || 0) || 0;
  if (bestRule.overrideExisting) return ruleRate;

  // override yoksa, ürünün indirimi varsa onu koru; yoksa kural indirimi uygula
  return base > 0 ? base : ruleRate;
};

const applyDiscountToProduct = (product, activeRules) => {
  const matched = activeRules.filter((r) => matchesRule(r, product));
  const rate = computeEffectiveDiscount(product, matched);

  const price = Number(product.price || 0);
  const finalPrice = rate > 0 ? Math.max(0, Number((price * (100 - rate)) / 100)) : price;

  return {
    effectiveDiscount: rate,
    effectivePrice: Number(finalPrice.toFixed(2)),
  };
};

const applyDiscountsToProducts = (products, activeRules) => {
  return products.map((doc) => {
    const p = typeof doc.toObject === "function" ? doc.toObject() : doc;
    const { effectiveDiscount, effectivePrice } = applyDiscountToProduct(p, activeRules);
    return { ...p, effectiveDiscount, effectivePrice };
  });
};

module.exports = {
  getActiveRules,
  clearDiscountCache,
  applyDiscountToProduct,
  applyDiscountsToProducts,
};