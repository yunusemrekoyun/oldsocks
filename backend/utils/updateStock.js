const Product = require("../models/Product");
const Order = require("../models/Order");

class StockUnavailableError extends Error {
  constructor(message = "Stock update failed for one or more items.") {
    super(message);
    this.name = "StockUnavailableError";
    this.code = "STOCK_UNAVAILABLE";
  }
}

class OrderPaymentStateError extends Error {
  constructor(message = "Order cannot be finalized from its current state.") {
    super(message);
    this.name = "OrderPaymentStateError";
    this.code = "ORDER_PAYMENT_STATE_INVALID";
  }
}

async function applyStockChanges(order, options = {}) {
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
  const result = await Product.bulkWrite(ops, {
    ordered: true,
    session: options.session,
  });
  const modified =
    result?.modifiedCount ??
    result?.result?.nModified ??
    0;
  if (modified !== ops.length) {
    throw new StockUnavailableError();
  }
}

/**
 * Stok düşümü ile siparişin paid işaretlenmesini tek Mongo işlemi içinde yapar.
 * Aynı PayTR bildirimi eşzamanlı gelse bile transaction yeniden denendiğinde ikinci
 * işlem paid + stockUpdated durumunu görür ve stoğu tekrar düşmez.
 */
async function finalizeOrderPayment(orderId) {
  const session = await Order.startSession();
  try {
    await session.withTransaction(async () => {
      const order = await Order.findById(orderId).session(session);
      if (!order) {
        const error = new Error("Order not found.");
        error.code = "ORDER_NOT_FOUND";
        throw error;
      }

      if (order.status === "paid" && order.stockUpdated) return;
      if (
        !["pending", "payment_review", "paid"].includes(order.status) ||
        order.stockUpdated
      ) {
        throw new OrderPaymentStateError();
      }

      await applyStockChanges(order, { session });
      order.status = "paid";
      order.stockUpdated = true;
      order.adminSeenAt = null;
      await order.save({ session });
    });
  } finally {
    await session.endSession();
  }

  return Order.findById(orderId);
}

module.exports = {
  applyStockChanges,
  finalizeOrderPayment,
  StockUnavailableError,
  OrderPaymentStateError,
};
