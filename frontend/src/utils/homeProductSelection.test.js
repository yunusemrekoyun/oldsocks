import test from "node:test";
import assert from "node:assert/strict";
import { pickHomeProducts } from "./homeProductSelection.js";

const pool = ["a", "b", "c", "d", "e"].map((_id) => ({ _id }));

test("karıştırma kapalıysa sunucunun sırası korunur ve 4 ürün gösterilir", () => {
  assert.deepEqual(pickHomeProducts(pool, { source: "best_selling", shuffle: false }).map((p) => p._id), ["a", "b", "c", "d"]);
});

test("rastgele modda yalnız havuzdaki ürünler gösterilir", () => {
  const picked = pickHomeProducts(pool.slice(0, 2), { source: "random" }, () => 0);
  assert.deepEqual(new Set(picked.map((p) => p._id)), new Set(["a", "b"]));
  assert.deepEqual(pickHomeProducts(undefined, { source: "latest" }), []);
});
