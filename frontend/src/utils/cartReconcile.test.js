import test from "node:test";
import assert from "node:assert/strict";
import { reconcileCart, sanitizeCartItems } from "./cartReconcile.js";

const A = "6ab8e4861f01b566cce50f01";
const B = "6ab8e4861f01b566cce50f02";
const C = "6ab8e4861f01b566cce50f03";

test("bozuk sepet verisi temizlenir, aynı ürün-beden satırları birleşir", () => {
  assert.deepEqual(sanitizeCartItems(null), []);
  assert.deepEqual(sanitizeCartItems({ id: A }), []);
  const items = sanitizeCartItems([
    { id: A, size: "M", qty: 2, price: 100, name: "Çorap" },
    { id: A, size: "M ", qty: 1, price: 100 },
    { id: "gecersiz", size: "M", qty: 1 },
    { id: B, size: "L", qty: 0 },
    "metin",
  ]);
  assert.equal(items.length, 1);
  assert.equal(items[0].qty, 3);
});

test("silinen ürün çıkarılır, stok aşımı düzeltilir, fiyat güncellenir", () => {
  const items = [
    { id: A, size: "M", qty: 3, price: 100, name: "Çorap" },
    { id: B, size: "L", qty: 1, price: 50, name: "Gömlek" },
    { id: C, size: "", qty: 1, price: 70, name: "Şapka" },
  ];
  const { items: next, notices, changed } = reconcileCart(items, [
    { id: A, size: "M", status: "insufficient", available: 2, price: 90 },
    { id: B, size: "L", status: "missing" },
    { id: C, size: "", status: "ok", available: 5, price: 70 },
  ]);
  assert.equal(changed, true);
  assert.deepEqual(next.map((i) => [i.id, i.qty, i.price]), [[A, 2, 90], [C, 1, 70]]);
  assert.equal(notices.length, 3);
  assert.match(notices.join(" "), /Gömlek \(L\) artık satışta değil/);
});

test("tükenen beden çıkarılır; değişiklik yoksa aynı dizi döner", () => {
  const items = [{ id: A, size: "M", qty: 1, price: 100 }];
  const same = reconcileCart(items, [{ id: A, size: "M", status: "ok", available: 3, price: 100 }]);
  assert.equal(same.changed, false);
  assert.equal(same.items, items);
  const soldOut = reconcileCart(items, [{ id: A, size: "M", status: "insufficient", available: 0, price: 100 }]);
  assert.deepEqual(soldOut.items, []);
});
