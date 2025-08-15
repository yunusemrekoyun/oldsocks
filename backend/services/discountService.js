// backend/services/discountService.js
const DiscountRule = require("../models/DiscountRule");
const Product = require("../models/Product");
const Category = require("../models/Category");

const round2 = (n) => Math.round(n * 100) / 100;

async function getDescendantCategoryIds(categoryIds) {
  // Çok seviyeli torunları getir (BFS)
  const all = new Set(categoryIds.map(String));
  let frontier = [...categoryIds];

  while (frontier.length) {
    const children = await Category.find({ parent: { $in: frontier } }).select("_id");
    const newIds = children.map((c) => String(c._id)).filter((id) => !all.has(id));
    newIds.forEach((id) => all.add(id));
    frontier = children.map((c) => c._id);
  }
  return Array.from(all);
}

async function resolveTargetCategoryIds(level, selectedIds) {
  if (level === "subcategory") {
    return selectedIds;
  }
  // level === "category": seçilen + tüm torunları
  return await getDescendantCategoryIds(selectedIds);
}

async function previewRule({ level, categories, percentage }) {
  const targetCatIds = await resolveTargetCategoryIds(level, categories);
  const products = await Product.find({ category: { $in: targetCatIds } }).select("_id name discount originalPrice price");
  const total = products.length;
  const alreadyDiscounted = products.filter((p) => (p.discount || 0) > 0).map((p) => ({ _id: p._id, name: p.name, discount: p.discount }));
  return { total, conflicts: alreadyDiscounted.length, conflictingProducts: alreadyDiscounted.slice(0, 20) };
}

async function applyRule(rule) {
  const targetCatIds = await resolveTargetCategoryIds(rule.level, rule.categories);
  const products = await Product.find({ category: { $in: targetCatIds } });

  const snapshots = [];
  const bulk = [];

  for (const p of products) {
    const hadDiscount = (p.discount || 0) > 0;
    if (hadDiscount && !rule.overwriteExisting) {
      // dokunma
      continue;
    }

    const prev = { product: p._id, prevDiscount: p.discount || 0, prevPrice: p.price, overwritten: hadDiscount };

    const newPrice = round2(p.originalPrice * (1 - rule.percentage / 100));
    bulk.push({
      updateOne: {
        filter: { _id: p._id },
        update: { $set: { discount: rule.percentage, price: newPrice } },
      },
    });
    snapshots.push(prev);
  }

  if (bulk.length) {
    await Product.bulkWrite(bulk);
  }

  // snapshotları ekle
  if (snapshots.length) {
    rule.appliedSnapshots.push(...snapshots);
    await rule.save();
  }
}

async function rollbackRule(rule) {
  if (!rule.appliedSnapshots?.length) return;

  const bulk = rule.appliedSnapshots.map((s) => ({
    updateOne: {
      filter: { _id: s.product },
      update: { $set: { discount: s.prevDiscount, price: s.prevPrice } },
    },
  }));

  if (bulk.length) {
    await Product.bulkWrite(bulk);
  }

  rule.appliedSnapshots = [];
  await rule.save();
}

async function tickScheduler() {
  const now = new Date();

  // scheduled → active
  const toActivate = await DiscountRule.find({
    status: "scheduled",
    startAt: { $lte: now },
    endAt: { $gt: now },
  });
  for (const rule of toActivate) {
    await applyRule(rule);
    rule.status = "active";
    await rule.save();
  }

  // active → expired (ve rollback)
  const toExpire = await DiscountRule.find({
    status: "active",
    endAt: { $lte: now },
  });
  for (const rule of toExpire) {
    await rollbackRule(rule);
    rule.status = "expired";
    await rule.save();
  }
}

module.exports = {
  previewRule,
  applyRule,
  rollbackRule,
  tickScheduler,
  resolveTargetCategoryIds,
};