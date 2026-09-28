const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const { startTestServer, postJson, CONSENT } = require("./helpers");

let server;

test.before(async () => {
  server = await startTestServer({ STOCK_HOLDS_PER_IP: "2" });
  await mongoose.connection.collection("shippingmethods").insertOne({ name: "Standart", fee: 10, freeShippingThreshold: null });
});

test.after(async () => {
  await server?.stop();
});

test("aynı IP aynı anda en fazla izin verilen sayıda ödeme oturumu açabilir", async () => {
  const productId = new mongoose.Types.ObjectId();
  await mongoose.connection.collection("products").insertOne({
    _id: productId, name: "Sınır ürün", images: [], imageAssets: [], price: 100, originalPrice: 100, discount: 0,
    category: new mongoose.Types.ObjectId(), sizes: [{ _id: new mongoose.Types.ObjectId(), size: "M", stock: 10 }],
    description: "", parentProductId: null, archivedAt: null, createdAt: new Date(), updatedAt: new Date(),
  });
  const start = (email, ip) =>
    postJson(
      server.base,
      "/api/v1/payment/start-guest",
      {
        cartItems: [{ id: String(productId), size: "M", qty: 1 }],
        address: { title: "Ev", mainaddress: "Adres 1", street: "Sk", city: "Kütahya" },
        guest: { firstName: "Sınır", lastName: "Deneme", email, phone: "05551234567", registrationAddress: "Adres 1" },
        consent: CONSENT,
      },
      { "X-Forwarded-For": ip }
    );
  assert.equal((await start("a@sinir.test", "10.20.0.1")).status, 200);
  assert.equal((await start("b@sinir.test", "10.20.0.1")).status, 200);
  const third = await start("c@sinir.test", "10.20.0.1");
  assert.equal(third.status, 429);
  assert.equal(third.data.code, "TOO_MANY_HOLDS");
  assert.equal((await start("d@sinir.test", "10.20.0.2")).status, 200);
});
