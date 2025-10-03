const Product = require("../models/Product");

module.exports.applyStockChanges = async (order) => {
  const items = Array.isArray(order?.items) ? order.items : [];
  if (!items.length) return;

  const ops = [];
  for (const { productId, size, qty } of items) {
    if (!productId) continue;
    const quantity = Number(qty);
    if (!Number.isFinite(quantity) || quantity <= 0) continue;
    const sizeKey = size ? String(size) : "";
    ops.push({
      updateOne: {
        filter: {
          _id: productId,
          sizes: {
            $elemMatch: { size: sizeKey, stock: { $gte: quantity } },
          },
        },
        update: { $inc: { "sizes.$.stock": -quantity } },
      },
    });
  }

  if (!ops.length) return;
  const result = await Product.bulkWrite(ops, { ordered: false });
  const modified =
    result?.modifiedCount ??
    result?.result?.nModified ??
    0;
  if (modified !== ops.length) {
    throw new Error("Stock update failed for one or more items.");
  }
};
