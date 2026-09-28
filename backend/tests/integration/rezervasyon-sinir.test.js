const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const { startTestServer, postJson, CONSENT } = require("./helpers");

let server;
let productId;

test.before(async () => {
  // 5 dakika izin verilen alt sınırın altında: 10 dakikaya yükseltilir.
  server = await startTestServer({ STOCK_HOLDS_PER_IP: "2", STOCK_HOLD_MINUTES: "5" });
  await mongoose.connection.collection("shippingmethods").insertOne({ name: "Standart", fee: 10, freeShippingThreshold: null });
  productId = await seedProduct();
});

test.after(async () => {
  await server?.stop();
});

const address = { title: "Ev", mainaddress: "Adres 1", street: "Sk", district: "Merkez", city: "Kütahya", postalCode: "43000" };

async function seedProduct() {
  const _id = new mongoose.Types.ObjectId();
  await mongoose.connection.collection("products").insertOne({
    _id, name: `Sınır ürün ${_id}`, images: [], imageAssets: [], price: 100, originalPrice: 100, discount: 0,
    category: new mongoose.Types.ObjectId(), sizes: [{ _id: new mongoose.Types.ObjectId(), size: "M", stock: 100 }],
    description: "", parentProductId: null, archivedAt: null, createdAt: new Date(), updatedAt: new Date(),
  });
  return _id;
}

const start = (email, ip, product = productId) =>
  postJson(
    server.base,
    "/api/v1/payment/start-guest",
    {
      cartItems: [{ id: String(product), size: "M", qty: 1 }],
      address,
      guest: { firstName: "Sınır", lastName: "Deneme", email, phone: "05551234567", registrationAddress: "Adres 1" },
      consent: CONSENT,
    },
    { "X-Forwarded-For": ip }
  );

test("aynı IP aynı anda en fazla izin verilen sayıda ödeme oturumu açabilir", async () => {
  assert.equal((await start("a@sinir.test", "10.20.0.1")).status, 200);
  assert.equal((await start("b@sinir.test", "10.20.0.1")).status, 200);
  const third = await start("c@sinir.test", "10.20.0.1");
  assert.equal(third.status, 429);
  assert.equal(third.data.code, "TOO_MANY_HOLDS");
  assert.equal((await start("d@sinir.test", "10.20.0.2")).status, 200);
});

test("aynı IP'den eşzamanlı başlatmalar da sınırı aşamaz", async () => {
  // Farklı ürünler: aynı ürünün stok kaydı zaten işlemleri sıraya sokar.
  const products = await Promise.all(Array.from({ length: 8 }, () => seedProduct()));
  const results = await Promise.all(
    products.map((product, i) => start(`es-${i}@sinir.test`, "10.20.0.3", product))
  );
  const statuses = results.map((r) => r.status).sort();
  assert.deepEqual(statuses, [200, 200, 429, 429, 429, 429, 429, 429]);
});

test("IPv6'da aynı ağdaki farklı adresler tek bağlantı sayılır", async () => {
  assert.equal((await start("v6a@sinir.test", "2001:db8:5:1::1")).status, 200);
  assert.equal((await start("v6b@sinir.test", "2001:db8:5:2::9")).status, 200);
  assert.equal((await start("v6c@sinir.test", "2001:db8:5:3:ffff::3")).status, 429);
});

test("üye, bağlantının misafir sınırına takılmaz", async () => {
  const email = `uye-${crypto.randomBytes(3).toString("hex")}@sinir.test`;
  const password = `Test-${crypto.randomBytes(6).toString("hex")}!aA1`;
  const addressId = new mongoose.Types.ObjectId();
  await mongoose.connection.collection("users").insertOne({
    firstName: "Sınır", lastName: "Üye", email, phone: "+905551234567", password: await bcrypt.hash(password, 4),
    role: "user", tokenVersion: 0, refreshTokens: [], createdAt: new Date(), updatedAt: new Date(),
    addresses: [{ _id: addressId, ...address }],
  });
  const login = await postJson(server.base, "/api/v1/auth/login", { email, password });
  const member = await postJson(
    server.base,
    "/api/v1/payment/start",
    { cartItems: [{ id: String(productId), size: "M", qty: 1 }], addressId: String(addressId), consent: CONSENT },
    { Authorization: `Bearer ${login.data.accessToken}`, "X-Forwarded-For": "10.20.0.1" }
  );
  assert.equal(member.status, 200, JSON.stringify(member.data));
});

test("en kısa ayrım süresinde de ödeme formu açılır", async () => {
  const res = await start("form@sinir.test", "10.20.0.9");
  assert.equal(res.status, 200, JSON.stringify(res.data));
  const minutes = (new Date(res.data.reservedUntil) - Date.now()) / 60000;
  assert.ok(minutes > 9 && minutes <= 10, String(minutes));
  const inline = await fetch(`${server.base}/api/v1/payment/inline/${res.data.conversationId}`);
  assert.equal(inline.status, 200);
});
