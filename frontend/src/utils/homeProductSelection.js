function shuffle(items, random) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
}

// Sunucu her bölüm için aday havuzunu hazırlar (GET /storefront/home-products); burada
// yalnız karıştırılır ve 4 ürün seçilir.
export function pickHomeProducts(pool, section, random = Math.random) {
  const items = Array.isArray(pool) ? pool : [];
  const config = section || {};
  const shouldShuffle = config.shuffle || config.source === "random";
  return (shouldShuffle ? shuffle(items, random) : items).slice(0, 4);
}
