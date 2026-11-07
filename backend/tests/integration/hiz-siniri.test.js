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

test("HEAD istekleri okuma sınırına sayılır; dakikada 2000'den sonrası 429 alır", async () => {
  const url = `${server.base}/api/v1/products?view=compact`;
  const statuses = [];
  // Yavaş yerel ortamda sıralı 2000 istek bir dakikalık pencereyi aşmasın.
  // Son beş istek, izin verilen grubun tamamlanmasından sonra gönderilir.
  for (let i = 0; i < 2000; i += 50) {
    const responses = await Promise.all(
      Array.from({ length: 50 }, () => fetch(url, { method: "HEAD" }))
    );
    statuses.push(...responses.map((res) => res.status));
  }
  const limited = await Promise.all(
    Array.from({ length: 5 }, () => fetch(url, { method: "HEAD" }))
  );
  statuses.push(...limited.map((res) => res.status));
  assert.equal(statuses.slice(0, 2000).every((s) => s === 200), true);
  assert.equal(statuses.slice(2000).every((s) => s === 429), true);
});

test("önbellekli okumalar geniş sınırda, önbelleksiz uçlar genel sınırda sayılır", async () => {
  const read = await fetch(`${server.base}/api/v1/storefront`);
  assert.equal(read.headers.get("ratelimit-limit"), "2000");
  const other = await fetch(`${server.base}/api/v1/blogs`);
  assert.equal(other.headers.get("ratelimit-limit"), "1200");
});

test("CORS ön kontrolü (OPTIONS) sınıra sayılmaz", async () => {
  const res = await fetch(`${server.base}/api/v1/products?view=compact`, {
    method: "OPTIONS",
    headers: { Origin: "http://localhost:5173", "Access-Control-Request-Method": "GET" },
  });
  assert.equal(res.status, 204);
});
