const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const { startTestServer, paytrCallback, postJson } = require("./helpers");

let server;
let Order;
let Product;

const guest = {
  firstName: "Deneme",
  lastName: "Müşteri",
  email: "deneme@oldscks.local",
  phone: "05551234567",
  registrationAddress: "Merkez Mah. Test Sk. No:1 Kütahya",
};
const address = {
  title: "Ev",
  mainaddress: "Merkez Mah. Test Sk. No:1",
  street: "Test Sk.",
  district: "Merkez",
  city: "Kütahya",
  postalCode: "43000",
};

async function seedProduct({ stock = 5, price = 250 } = {}) {
  const categoryId = new mongoose.Types.ObjectId();
  await mongoose.connection.collection("categories").insertOne({
    _id: categoryId,
    name: `Test kategori ${categoryId}`,
    parent: null,
    archivedAt: null,
  });
  const productId = new mongoose.Types.ObjectId();
  await mongoose.connection.collection("products").insertOne({
    _id: productId,
    name: `Test ürün ${productId}`,
    images: [],
    imageAssets: [],
    price,
    originalPrice: price,
    discount: 0,
    category: categoryId,
    color: "Siyah",
    sizes: [{ _id: new mongoose.Types.ObjectId(), size: "M", stock }],
    description: "",
    parentProductId: null,
    archivedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return productId;
}

async function stockOf(productId) {
  const p = await mongoose.connection.collection("products").findOne({ _id: productId });
  return p.sizes[0].stock;
}

async function startGuestOrder(productId, qty = 1) {
  const res = await postJson(server.base, "/api/v1/payment/start-guest", {
    cartItems: [{ id: String(productId), size: "M", qty }],
    address,
    guest,
  });
  assert.equal(res.status, 200, JSON.stringify(res.data));
  const order = await Order.findOne({ conversationId: res.data.conversationId });
  return { conversationId: res.data.conversationId, order };
}

test.before(async () => {
  server = await startTestServer();
  Order = mongoose.connection.collection("orders");
  Product = mongoose.connection.collection("products");
  await mongoose.connection.collection("shippingmethods").insertOne({
    name: "Standart Kargo",
    fee: 50,
    freeShippingThreshold: null,
  });
});

test.after(async () => {
  await server?.stop();
});

test("misafir siparişi imzalı PayTR bildirimiyle ödenir, stok bir kez düşer", async () => {
  const productId = await seedProduct({ stock: 5 });
  const { conversationId, order } = await startGuestOrder(productId, 2);
  assert.equal(order.status, "pending");
  assert.equal(order.totalPrice, 550);

  const totalAmount = Math.round(order.totalPrice * 100);
  const first = await paytrCallback(server.base, { merchantOid: conversationId, totalAmount });
  assert.equal(first.text, "OK");
  const second = await paytrCallback(server.base, { merchantOid: conversationId, totalAmount });
  assert.equal(second.text, "OK");

  const paid = await Order.findOne({ conversationId });
  assert.equal(paid.status, "paid");
  assert.equal(paid.stockUpdated, true);
  assert.equal(await stockOf(productId), 3);
});

test("imzası geçersiz bildirim reddedilir, sipariş beklemede kalır", async () => {
  const productId = await seedProduct({ stock: 2 });
  const { conversationId, order } = await startGuestOrder(productId);
  const res = await paytrCallback(server.base, {
    merchantOid: conversationId,
    totalAmount: Math.round(order.totalPrice * 100),
    hash: "gecersiz-imza",
  });
  assert.equal(res.status, 400);
  const after = await Order.findOne({ conversationId });
  assert.equal(after.status, "pending");
  assert.equal(await stockOf(productId), 2);
});

test("eksik tutarlı bildirim siparişi incelemeye alır, stok düşmez", async () => {
  const productId = await seedProduct({ stock: 2 });
  const { conversationId, order } = await startGuestOrder(productId);
  const res = await paytrCallback(server.base, {
    merchantOid: conversationId,
    totalAmount: Math.round(order.totalPrice * 100) - 1,
  });
  assert.equal(res.text, "OK");
  const after = await Order.findOne({ conversationId });
  assert.equal(after.status, "payment_review");
  assert.equal(await stockOf(productId), 2);
});

test("başarısız ödeme bildirimi bekleyen siparişi iptal eder", async () => {
  const productId = await seedProduct({ stock: 1 });
  const { conversationId, order } = await startGuestOrder(productId);
  const res = await paytrCallback(server.base, {
    merchantOid: conversationId,
    status: "failed",
    totalAmount: Math.round(order.totalPrice * 100),
  });
  assert.equal(res.text, "OK");
  const after = await Order.findOne({ conversationId });
  assert.equal(after.status, "cancelled");
  assert.equal(await stockOf(productId), 1);
});

test("son adet için iki ödeme: ilki ödenir, ikincisi incelemeye düşer (stok eksiye inmez)", async () => {
  const productId = await seedProduct({ stock: 1 });
  const a = await startGuestOrder(productId);
  const b = await startGuestOrder(productId);
  const amountA = Math.round(a.order.totalPrice * 100);
  const amountB = Math.round(b.order.totalPrice * 100);
  await Promise.all([
    paytrCallback(server.base, { merchantOid: a.conversationId, totalAmount: amountA }),
    paytrCallback(server.base, { merchantOid: b.conversationId, totalAmount: amountB }),
  ]);
  const statuses = (await Order.find({ conversationId: { $in: [a.conversationId, b.conversationId] } }).toArray())
    .map((o) => o.status)
    .sort();
  assert.deepEqual(statuses, ["paid", "payment_review"]);
  assert.equal(await stockOf(productId), 0);
});

test("sipariş onay ve mock ödeme uçları yalnız metin sipariş kimliği kabul eder", async () => {
  const productId = await seedProduct({ stock: 3 });
  await startGuestOrder(productId);
  for (const path of ["/api/v1/orders/confirm", "/api/v1/payment/mock-complete"]) {
    const res = await postJson(server.base, path, { conversationId: { $regex: "." } });
    assert.equal(res.status, 400, `${path} → ${res.status} ${JSON.stringify(res.data)}`);
  }
});
