const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const { startTestServer, postJson } = require("./helpers");

let server;
let adminToken;
let History;

async function admin(method, pathName, body) {
  const res = await fetch(`${server.base}/api/v1${pathName}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json().catch(() => null) };
}

const waitFor = async (check, ms = 2000) => {
  const end = Date.now() + ms;
  for (;;) {
    const value = await check();
    if (value || Date.now() > end) return value;
    await new Promise((r) => setTimeout(r, 100));
  }
};

test.before(async () => {
  server = await startTestServer();
  History = mongoose.connection.collection("pricehistories");
  const password = `Test-${crypto.randomBytes(6).toString("hex")}!aA1`;
  await mongoose.connection.collection("users").insertOne({
    firstName: "Test", lastName: "Yönetici", email: "fiyat@test.local",
    password: await bcrypt.hash(password, 4), role: "admin", tokenVersion: 0,
    addresses: [], refreshTokens: [], createdAt: new Date(), updatedAt: new Date(),
  });
  const login = await postJson(server.base, "/api/v1/auth/login", { email: "fiyat@test.local", password });
  adminToken = login.data.accessToken;
});

test.after(async () => {
  await server?.stop();
});

test("indirim kuralı açılıp kapanınca fiyat değişiklikleri geçmişe yazılır", async () => {
  const _id = new mongoose.Types.ObjectId();
  await mongoose.connection.collection("products").insertOne({
    _id, name: "Geçmiş ürün", images: [], imageAssets: [], price: 500, originalPrice: 500, discount: 0,
    category: new mongoose.Types.ObjectId(), sizes: [{ size: "M", stock: 1 }], description: "",
    parentProductId: null, archivedAt: null, createdAt: new Date(), updatedAt: new Date(),
  });
  const rule = await admin("POST", "/discounts", {
    title: "Geçmiş testi", discountRate: 20, selectionType: "product", targetIds: [String(_id)], isActive: true,
  });
  assert.equal(rule.status, 201);
  await admin("PUT", `/discounts/${rule.data._id}/toggle`, { isActive: false });

  const rows = await History.find({ product: _id }).sort({ at: 1 }).toArray();
  assert.deepEqual(rows.map((r) => [r.source, r.price]), [["discount", 400], ["discount_revert", 500]]);
});

test("geçmişi olmayan ürünlere başlangıç kaydı bir kez eklenir", async () => {
  const _id = new mongoose.Types.ObjectId();
  await mongoose.connection.collection("products").insertOne({
    _id, name: "Eski ürün", images: [], imageAssets: [], price: 250, originalPrice: 300, discount: 16.67,
    category: new mongoose.Types.ObjectId(), sizes: [], description: "", parentProductId: null,
    archivedAt: null, createdAt: new Date(), updatedAt: new Date(),
  });
  // Sunucu bunu açılışta çağırır; test aynı veritabanında servisi doğrudan çalıştırır.
  const { ensureInitialPriceHistory, lowestPriceBefore } = require("../../services/priceHistory");
  assert.equal(await ensureInitialPriceHistory(), 1);
  assert.equal(await ensureInitialPriceHistory(), 0);
  const row = await History.findOne({ product: _id });
  assert.deepEqual([row.source, row.price, row.originalPrice], ["initial", 250, 300]);
  assert.equal(await lowestPriceBefore(_id, new Date(Date.now() + 1000)), 250);
});
