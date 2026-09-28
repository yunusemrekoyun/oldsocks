const test = require("node:test");
const assert = require("node:assert/strict");
const { mergeStockEdits } = require("../services/catalogValidation");

test("form açıkken değişen stok korunur; yöneticinin değişikliği güncel stoğa eklenir", () => {
  const parsed = [{ size: "M", stock: 5 }, { size: "L", stock: 2 }, { size: "XL", stock: 4 }];
  const raw = [{ size: "M", stock: 5, loadedStock: 3 }, { size: "L", stock: 2, loadedStock: 2 }, { size: "XL", stock: 4 }];
  const current = [{ size: "M", stock: 2 }, { size: "l", stock: 1 }];
  assert.deepEqual(mergeStockEdits(parsed, raw, current), [
    { size: "M", stock: 4 }, // 2 + (5 - 3)
    { size: "L", stock: 1 }, // değişmedi: güncel değer kalır
    { size: "XL", stock: 4 }, // yeni satır: girilen değer
  ]);
});

test("değişiklik stoğu eksiye düşüremez; bozuk girdi olduğu gibi döner", () => {
  assert.deepEqual(
    mergeStockEdits([{ size: "M", stock: 0 }], [{ size: "M", stock: 0, loadedStock: 5 }], [{ size: "M", stock: 2 }]),
    [{ size: "M", stock: 0 }]
  );
  assert.deepEqual(mergeStockEdits([{ size: "M", stock: 3 }], "bozuk", [{ size: "M", stock: 9 }]), [{ size: "M", stock: 3 }]);
});
