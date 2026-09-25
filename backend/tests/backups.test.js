const assert = require("node:assert/strict");
const { test } = require("node:test");
const { makeRecoveryKit, openRecoveryKit } = require("../services/backups/secrets");
const { mergedSizes } = require("../services/backups/restore");

test("kurtarma kiti yalnızca doğru parola ile açılır", async () => {
  const payload = {
    version: 1,
    repository: "rclone:test:repo",
    rcloneConfig: "[test]\ntype = drive\n",
    resticPassword: "example-password",
    masterKey: Buffer.alloc(32, 7).toString("base64"),
  };
  const kit = await makeRecoveryKit(payload, "uzun-ve-ayri-bir-parola-123");
  assert.deepEqual(await openRecoveryKit(kit, "uzun-ve-ayri-bir-parola-123"), payload);
  await assert.rejects(openRecoveryKit(kit, "yanlis-parola-123456"));
  assert.equal(JSON.stringify(kit).includes(payload.resticPassword), false);
});

test("katalog geri yüklemesi mevcut stokları korur, eski ürünü sıfır stokla getirir", () => {
  const historic = { sizes: [{ size: "S", stock: 7 }, { size: "M", stock: 9 }] };
  const current = { sizes: [{ size: "S", stock: 2 }, { size: "L", stock: 4 }] };
  assert.deepEqual(mergedSizes(historic, current).map((item) => [item.size, item.stock]), [
    ["S", 2], ["M", 0], ["L", 4],
  ]);
  assert.deepEqual(mergedSizes(historic, null).map((item) => item.stock), [0, 0]);
});
