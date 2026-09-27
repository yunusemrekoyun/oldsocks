const Product = require("../models/Product");
const PriceHistory = require("../models/PriceHistory");

const round2 = (n) => Math.round(Number(n) * 100) / 100;
const DAY_MS = 24 * 60 * 60 * 1000;

// entries: [{ product, price, originalPrice }]
async function recordPrices(entries, { source, session } = {}) {
  const docs = (entries || [])
    .filter((e) => e?.product && Number.isFinite(Number(e.price)))
    .map((e) => ({
      product: e.product,
      price: round2(e.price),
      originalPrice: Number.isFinite(Number(e.originalPrice)) ? round2(e.originalPrice) : null,
      source,
      at: new Date(),
    }));
  if (docs.length) await PriceHistory.insertMany(docs, { session, ordered: false });
}

// Geçmişi olmayan ürünler için bugünkü fiyat başlangıç kaydı olur (tekrar çalışınca bir şey yapmaz).
async function ensureInitialPriceHistory() {
  const known = await PriceHistory.distinct("product");
  const missing = await Product.find({ _id: { $nin: known } }).select("_id price originalPrice").lean();
  await recordPrices(
    missing.map((p) => ({ product: p._id, price: p.price, originalPrice: p.originalPrice })),
    { source: "initial" }
  );
  return missing.length;
}

// Belirli bir andan önceki 30 gün içinde uygulanan en düşük fiyat.
async function lowestPriceBefore(productId, until = new Date(), days = 30) {
  const since = new Date(until.getTime() - days * DAY_MS);
  const [inWindow, before] = await Promise.all([
    PriceHistory.find({ product: productId, at: { $gte: since, $lt: until } }).select("price").lean(),
    PriceHistory.findOne({ product: productId, at: { $lt: since } }).sort({ at: -1 }).select("price").lean(),
  ]);
  const prices = [...inWindow.map((h) => h.price), ...(before ? [before.price] : [])];
  return prices.length ? Math.min(...prices) : null;
}

module.exports = { recordPrices, ensureInitialPriceHistory, lowestPriceBefore };
