const { invalidateCatalog } = require("../services/catalogCache");
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
          archivedAt: null,
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

// İptal edilen siparişin adetlerini stoğa geri ekler. Silinmiş ürün veya kaldırılmış
// beden atlanır; atlanan kalemler döndürülür.
async function restoreStock(order, options = {}) {
  const items = Array.isArray(order?.items) ? order.items : [];
  const skipped = [];
  for (const item of items) {
    const quantity = Number(item.qty);
    if (!item.productId || !Number.isFinite(quantity) || quantity <= 0) continue;
    const result = await Product.updateOne(
      { _id: item.productId, "sizes.size": item.size ? String(item.size) : "" },
      { $inc: { "sizes.$.stock": quantity } },
      { session: options.session }
    );
    if (!result.modifiedCount) skipped.push({ name: item.name, size: item.size || "", qty: quantity });
  }
  return { skipped };
}

// Sistemin kısa süre içinde kapattığı (stoğu geri verilmiş) ödeme oturumları. Bunlara
// sonradan başarılı ödeme gelirse stok yeniden düşülmeye çalışılır. 24 saat sonra
// kapatılan (payment_abandoned) veya yöneticinin iptal ettiği siparişe gelen ödeme ise
// yöneticinin incelemesine düşer.
const RELEASED_REASONS = Object.freeze([
  "reservation_expired",
  "session_replaced",
  "coupon_session_replaced",
]);

/**
 * Siparişi "ödendi" yapar; stok ödeme adımında ayrıldıysa tekrar düşmez, ayrılmadıysa
 * (eski oturum ya da süresi dolup geri verilmiş rezervasyon) aynı işlemde düşer.
 * Aynı PayTR bildirimi eşzamanlı gelse bile ikinci işlem paid + stockUpdated durumunu
 * görür ve stoğu tekrar düşmez.
 * allowReleased: sistemin kapattığı oturuma geç gelen ödemeyi kabul et.
 */
async function finalizeOrderPayment(orderId, { allowReleased = false } = {}) {
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
      const released =
        allowReleased && order.status === "cancelled" && RELEASED_REASONS.includes(order.cancelReason);
      if (!["pending", "payment_review", "paid"].includes(order.status) && !released) {
        throw new OrderPaymentStateError();
      }

      if (!order.stockUpdated) await applyStockChanges(order, { session });
      order.status = "paid";
      order.stockUpdated = true;
      order.stockReservedUntil = null;
      order.adminSeenAt = null;
      if (released) {
        order.cancelReason = null;
        order.cancelledAt = null;
      }
      await order.save({ session });
    });
    // İşlem kaydedildikten sonra: vitrin stoğu hemen güncel görünsün.
    invalidateCatalog();
  } finally {
    await session.endSession();
  }

  return Order.findById(orderId);
}

module.exports = {
  RELEASED_REASONS,
  applyStockChanges,
  restoreStock,
  finalizeOrderPayment,
  StockUnavailableError,
  OrderPaymentStateError,
};
