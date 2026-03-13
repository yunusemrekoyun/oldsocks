const CouponUsage = require("../models/CouponUsage");

function normalizeCouponCode(value) {
  return String(value || "").trim().toUpperCase();
}

function normalizeEmailKey(value) {
  return String(value || "").trim().toLowerCase();
}

async function hasCouponUsage({ couponId, userId, email }) {
  const conditions = [];

  if (userId) {
    conditions.push({ user: userId });
  }

  const emailKey = normalizeEmailKey(email);
  if (emailKey) {
    conditions.push({ emailKey });
  }

  if (!couponId || conditions.length === 0) {
    return false;
  }

  const existing = await CouponUsage.findOne({
    couponId,
    $or: conditions,
  })
    .select("_id")
    .lean();

  return Boolean(existing);
}

async function recordCouponUsageForOrder(order) {
  const couponId = order?.coupon?.couponId;
  if (!couponId) return null;

  const existingForOrder = await CouponUsage.findOne({ orderId: order._id })
    .select("_id")
    .lean();
  if (existingForOrder) return existingForOrder;

  const payload = {
    couponId,
    user: order?.user || null,
    emailKey: normalizeEmailKey(order?.guest?.email || ""),
    orderId: order?._id || null,
    orderConversationId: order?.conversationId || null,
    usedAt: new Date(),
  };

  return CouponUsage.create(payload);
}

module.exports = {
  normalizeCouponCode,
  normalizeEmailKey,
  hasCouponUsage,
  recordCouponUsageForOrder,
};
