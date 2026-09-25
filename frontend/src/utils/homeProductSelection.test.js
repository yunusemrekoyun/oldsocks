import test from "node:test";
import assert from "node:assert/strict";
import { selectHomeProducts } from "./homeProductSelection.js";

const products = [
  { _id: "a", createdAt: "2026-01-01", category: { _id: "child", parent: { _id: "root" } } },
  { _id: "b", createdAt: "2026-02-01", category: { _id: "other" } },
  { _id: "c", createdAt: "2026-03-01", category: { _id: "root" } },
];

test("yeni ürünler tarihe göre, kategori hem kök hem alt ürünlerle seçilir", () => {
  assert.deepEqual(selectHomeProducts(products, { source: "latest", shuffle: false }).map((item) => item._id), ["c", "b", "a"]);
  assert.deepEqual(selectHomeProducts(products, { source: "category", categoryId: "root", shuffle: false }).map((item) => item._id), ["c", "a"]);
});

test("elle seçim sırası ve gerçek satış sırası korunur", () => {
  assert.deepEqual(selectHomeProducts(products, { source: "manual", productIds: ["b", "a"], shuffle: false }).map((item) => item._id), ["b", "a"]);
  assert.deepEqual(selectHomeProducts(products, { source: "best_selling", shuffle: false }, ["a", "c"]).map((item) => item._id), ["a", "c"]);
});

test("rastgele mod yalnızca seçilen havuzdan ürün gösterir", () => {
  const picked = selectHomeProducts(products, { source: "manual", productIds: ["a", "b"], shuffle: true }, [], () => 0);
  assert.deepEqual(new Set(picked.map((item) => item._id)), new Set(["a", "b"]));
});
