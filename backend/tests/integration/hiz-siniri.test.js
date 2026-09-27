const test = require("node:test");
const assert = require("node:assert/strict");
const { startTestServer } = require("./helpers");

let server;

test.before(async () => {
  server = await startTestServer();
});

test.after(async () => {
  await server?.stop();
});

test("HEAD istekleri okuma sınırına sayılır; dakikada 300'den sonrası 429 alır", async () => {
  const url = `${server.base}/api/v1/products?view=compact`;
  const statuses = [];
  for (let i = 0; i < 305; i += 1) {
    const res = await fetch(url, { method: "HEAD" });
    statuses.push(res.status);
  }
  assert.equal(statuses.slice(0, 300).every((s) => s === 200), true);
  assert.equal(statuses.slice(300).every((s) => s === 429), true);
});

test("CORS ön kontrolü (OPTIONS) sınıra sayılmaz", async () => {
  const res = await fetch(`${server.base}/api/v1/products?view=compact`, {
    method: "OPTIONS",
    headers: { Origin: "http://localhost:5173", "Access-Control-Request-Method": "GET" },
  });
  assert.equal(res.status, 204);
});
