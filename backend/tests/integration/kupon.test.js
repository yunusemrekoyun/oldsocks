const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const { startTestServer, paytrCallback, postJson } = require("./helpers");

let server;
let adminToken;
let shippingId;
let Orders;

const address = {
  title: "Ev",
  mainaddress: "Merkez Mah. Test Sk. No:1",
  street: "Test Sk.",
  district: "Merkez",
  city: "Kütahya",
  postalCode: "43000",
};

function guest(email) {
  return {
    firstName: "Kupon",
    lastName: "Müşteri",
    email,
    phone: "05551234567",
    registrationAddress: "Merkez Mah. Test Sk. No:1 Kütahya",
  };
}

async function seedProduct(price = 200) {
  const categoryId = new mongoose.Types.ObjectId();
  await mongoose.connection.collection("categories").insertOne({
    _id: categoryId,
    name: `Kupon kategori ${categoryId}`,
    parent: null,
    archivedAt: null,
  });
  const productId = new mongoose.Types.ObjectId();
  await mongoose.connection.collection("products").insertOne({
    _id: productId,
    name: `Kupon ürün ${productId}`,
    images: [],
    imageAssets: [],
    price,
    originalPrice: price,
    discount: 0,
    category: categoryId,
    color: "Siyah",
    sizes: [{ _id: new mongoose.Types.ObjectId(), size: "M", stock: 50 }],
    description: "",
    parentProductId: null,
    archivedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return productId;
}

async function seedCoupon(productId, extra = {}) {
  const code = `K${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  await mongoose.connection.collection("coupons").insertOne({
    code,
    isEnabled: true,
    discountType: "percent",
    discountValue: 10,
    minimumSubtotal: 0,
    expiresAt: null,
    maxUses: null,
    productIds: [productId],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...extra,
  });
  return code;
}

function startGuest(productId, email, couponCode) {
  return postJson(server.base, "/api/v1/payment/start-guest", {
    cartItems: [{ id: String(productId), size: "M", qty: 1 }],
    address,
    guest: guest(email),
    couponCode,
  });
}

async function adminRequest(method, pathName, body) {
  const res = await fetch(`${server.base}/api/v1${pathName}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json().catch(() => null) };
}

test.before(async () => {
  server = await startTestServer();
  Orders = mongoose.connection.collection("orders");
  const password = `Test-${crypto.randomBytes(6).toString("hex")}!aA1`;
  await mongoose.connection.collection("users").insertOne({
    firstName: "Test",
    lastName: "Yönetici",
    email: "kupon-yonetici@test.local",
    password: await bcrypt.hash(password, 4),
    role: "admin",
    tokenVersion: 0,
    addresses: [],
    refreshTokens: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const login = await postJson(server.base, "/api/v1/auth/login", {
    email: "kupon-yonetici@test.local",
    password,
  });
  assert.equal(login.status, 200);
  adminToken = login.data.accessToken;
  const shipping = await adminRequest("POST", "/shipping", { name: "Standart", fee: 50 });
  assert.equal(shipping.status, 201);
  shippingId = shipping.data._id;
});

test.after(async () => {
  await server?.stop();
});

test("yönetici kupona bitiş tarihi ve kullanım sınırı verebilir, geçersiz sınır reddedilir", async () => {
  const productId = await seedProduct();
  const expiresAt = new Date(Date.now() + 86400000).toISOString();
  const ok = await adminRequest("POST", "/coupons", {
    code: "YAZ-SONU",
    discountType: "percent",
    discountValue: 15,
    minimumSubtotal: 0,
    expiresAt,
    maxUses: 3,
    productIds: [String(productId)],
  });
  assert.equal(ok.status, 201, JSON.stringify(ok.data));
  assert.equal(ok.data.maxUses, 3);
  assert.equal(new Date(ok.data.expiresAt).toISOString(), expiresAt);

  const bad = await adminRequest("POST", "/coupons", {
    code: "HATALI-SINIR",
    discountType: "percent",
    discountValue: 15,
    maxUses: 0,
    productIds: [String(productId)],
  });
  assert.equal(bad.status, 400);
});

test("süresi dolmuş kupon ödeme başlatmada reddedilir", async () => {
  const productId = await seedProduct();
  const code = await seedCoupon(productId, { expiresAt: new Date(Date.now() - 1000) });
  const res = await startGuest(productId, "sure@test.local", code);
  assert.equal(res.status, 409);
  assert.match(res.data.message, /süresi dolmuş/);
});

test("kartı reddedilen müşteri aynı kuponla tekrar deneyebilir; eski oturum kapanır", async () => {
  const productId = await seedProduct();
  const code = await seedCoupon(productId, { maxUses: 1 });
  const first = await startGuest(productId, "tekrar@test.local", code);
  assert.equal(first.status, 200, JSON.stringify(first.data));
  const second = await startGuest(productId, "TEKRAR@test.local", code);
  assert.equal(second.status, 200, JSON.stringify(second.data));

  const old = await Orders.findOne({ conversationId: first.data.conversationId });
  assert.equal(old.status, "cancelled");
  assert.equal(old.cancelReason, "coupon_session_replaced");
  const current = await Orders.findOne({ conversationId: second.data.conversationId });
  assert.equal(current.status, "pending");
});

test("kullanım sınırı dolan kupon başka müşteriye kapanır", async () => {
  const productId = await seedProduct();
  const code = await seedCoupon(productId, { maxUses: 1 });
  const a = await startGuest(productId, "birinci@test.local", code);
  assert.equal(a.status, 200);

  // A'nın ödeme oturumu açıkken sınır dolu sayılır.
  const b = await startGuest(productId, "ikinci@test.local", code);
  assert.equal(b.status, 409);
  assert.match(b.data.message, /kullanım sınırına/);

  // A öder; sınır dolu kalır.
  const order = await Orders.findOne({ conversationId: a.data.conversationId });
  const paid = await paytrCallback(server.base, {
    merchantOid: a.data.conversationId,
    totalAmount: Math.round(order.totalPrice * 100),
  });
  assert.equal(paid.text, "OK");
  const again = await startGuest(productId, "ikinci@test.local", code);
  assert.equal(again.status, 409);
});

test("kuponu ödeyerek kullanan müşteri aynı kuponu ikinci kez kullanamaz", async () => {
  const productId = await seedProduct();
  const code = await seedCoupon(productId);
  const first = await startGuest(productId, "tek@test.local", code);
  assert.equal(first.status, 200);
  const order = await Orders.findOne({ conversationId: first.data.conversationId });
  await paytrCallback(server.base, {
    merchantOid: first.data.conversationId,
    totalAmount: Math.round(order.totalPrice * 100),
  });

  const second = await startGuest(productId, "tek@test.local", code);
  assert.equal(second.status, 409);
  assert.match(second.data.message, /daha önce kullandınız/);
});

test("kargo ücreti negatif olamaz", async () => {
  const create = await adminRequest("POST", "/shipping", { name: "Hatalı", fee: -10 });
  assert.equal(create.status, 400);
  const update = await adminRequest("PUT", `/shipping/${shippingId}`, { fee: -1 });
  assert.equal(update.status, 400);
  const blank = await adminRequest("PUT", `/shipping/${shippingId}`, { name: "  " });
  assert.equal(blank.status, 400);
});

test("toplamı 1 TL'nin altına düşen sipariş için ödeme başlatılmaz", async () => {
  const productId = await seedProduct(100);
  const code = await seedCoupon(productId, { discountType: "fixed", discountValue: 100 });
  const free = await adminRequest("PUT", `/shipping/${shippingId}`, { fee: 0 });
  assert.equal(free.status, 200);
  try {
    const res = await startGuest(productId, "sifir@test.local", code);
    assert.equal(res.status, 422);
    assert.equal(await Orders.countDocuments({ "guest.email": "sifir@test.local" }), 0);
  } finally {
    await adminRequest("PUT", `/shipping/${shippingId}`, { fee: 50 });
  }
});
