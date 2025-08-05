const Product = require("../models/Product");

module.exports.applyStockChanges = async (order) => {
  const ops = order.items.map(({ productId, size, qty }) => {
    const sizeFilter = size ? { size } : { size: "" }; // bedensiz = ""
    return {
      updateOne: {
        filter: { _id: productId, sizes: { $elemMatch: sizeFilter } },
        update: { $inc: { "sizes.$.stock": -qty } },
      },
    };
  });

  if (ops.length) await Product.bulkWrite(ops);
};
