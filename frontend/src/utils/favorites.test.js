import test from "node:test";
import assert from "node:assert/strict";

let moduleVersion = 0;

async function browser(t) {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const values = new Map();
  const target = new EventTarget();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
  };
  Object.defineProperty(target, "localStorage", { value: storage, configurable: true });
  Object.defineProperty(globalThis, "window", { value: target, configurable: true });
  t.after(() => {
    if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow);
    else delete globalThis.window;
  });
  const favorites = await import(`./favorites.js?test=${++moduleVersion}`);
  const storageEvent = (key) => {
    const event = new Event("storage");
    Object.defineProperty(event, "key", { value: key });
    target.dispatchEvent(event);
  };
  return { ...favorites, target, storage, values, storageEvent };
}

test("favoriler tekilleştirilir, bozuk kayıtlar atlanır ve liste sınırlı tutulur", async (t) => {
  const favorites = await browser(t);
  const entries = [" same ", "same", null, {}, "", ...Array.from({ length: 600 }, (_, i) => `product-${i}`)];
  favorites.values.set(favorites.FAVORITES_KEY, JSON.stringify(entries));
  assert.equal(favorites.getFavoriteIds().length, favorites.MAX_FAVORITES);
  assert.equal(favorites.getFavoriteIds()[0], "same");
  assert.strictEqual(favorites.getFavoriteIds(), favorites.getFavoriteIds());

  favorites.toggleFavorite("newest");
  assert.equal(favorites.getFavoriteIds()[0], "newest");
  assert.equal(JSON.parse(favorites.values.get(favorites.FAVORITES_KEY)).length, favorites.MAX_FAVORITES);
  assert.equal(favorites.toggleFavorite({}), false);
});

test("bozuk JSON ve yanlış veri biçimi favori eklemeyi engellemez", async (t) => {
  const favorites = await browser(t);
  for (const raw of ["{broken", '{"product":"a"}', "null"]) {
    favorites.values.set(favorites.FAVORITES_KEY, raw);
    assert.deepEqual(favorites.getFavoriteIds(), []);
  }
  favorites.toggleFavorite("a");
  assert.deepEqual(JSON.parse(favorites.values.get(favorites.FAVORITES_KEY)), ["a"]);
  favorites.toggleFavorite("a");
  assert.deepEqual(favorites.getFavoriteIds(), []);
});

test("aynı sayfadaki aboneler ekleme ve toplu kaldırmayı birlikte görür", async (t) => {
  const favorites = await browser(t);
  const observed = [];
  const unsubscribe = favorites.subscribeFavorites(() => observed.push([...favorites.getFavoriteIds()]));
  favorites.toggleFavorite("a");
  favorites.toggleFavorite("b");
  favorites.removeFavorites(["a", "b"]);
  assert.deepEqual(observed, [["a"], ["b", "a"], []]);
  unsubscribe();
  favorites.toggleFavorite("c");
  assert.equal(observed.length, 3);
});

test("başka sekmedeki değişiklik ve depolamayı temizleme listeye yansır", async (t) => {
  const favorites = await browser(t);
  favorites.toggleFavorite("a");
  const observed = [];
  const unsubscribe = favorites.subscribeFavorites(() => observed.push([...favorites.getFavoriteIds()]));
  favorites.values.set(favorites.FAVORITES_KEY, '["other-tab"]');
  favorites.storageEvent("unrelated");
  assert.deepEqual(observed, []);
  favorites.storageEvent(favorites.FAVORITES_KEY);
  favorites.values.clear();
  favorites.storageEvent(null);
  assert.deepEqual(observed, [["other-tab"], []]);
  unsubscribe();
});

test("depolamaya erişilemiyorsa favoriler oturum belleğinde çalışır", async (t) => {
  const favorites = await browser(t);
  Object.defineProperty(favorites.target, "localStorage", { get: () => { throw new Error("Denied"); } });
  assert.deepEqual(favorites.getFavoriteIds(), []);
  favorites.toggleFavorite("a");
  favorites.toggleFavorite("b");
  assert.deepEqual(favorites.getFavoriteIds(), ["b", "a"]);
  favorites.removeFavorite("a");
  assert.deepEqual(favorites.getFavoriteIds(), ["b"]);
  favorites.clearFavorites();
  assert.deepEqual(favorites.getFavoriteIds(), []);
});

test("yazma kotası dolarsa mevcut disk kaydı yeni oturum seçimini ezmez", async (t) => {
  const favorites = await browser(t);
  favorites.values.set(favorites.FAVORITES_KEY, '["saved"]');
  favorites.storage.setItem = () => { throw new Error("Quota exceeded"); };
  favorites.toggleFavorite("new");
  assert.deepEqual(favorites.getFavoriteIds(), ["new", "saved"]);
  assert.equal(favorites.values.get(favorites.FAVORITES_KEY), '["saved"]');
  favorites.toggleFavorite("saved");
  assert.deepEqual(favorites.getFavoriteIds(), ["new"]);
});
