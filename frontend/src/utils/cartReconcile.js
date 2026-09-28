// Sepeti sunucudaki güncel fiyat ve stokla eşitler (saf fonksiyon).
// results: /cart-campaigns/check yanıtındaki satırlar.
export const cartKey = (id, size) => `${String(id)}:::${String(size ?? "").trim()}`;

const MAX_QTY = 1000;

// localStorage'dan okunan veriyi doğrular; bozuk satırlar atılır.
export function sanitizeCartItems(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Map();
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const id = String(raw.id ?? "").trim();
    if (!/^[a-f0-9]{24}$/i.test(id)) continue;
    const size = String(raw.size ?? "").trim();
    const qty = Math.min(MAX_QTY, Math.floor(Number(raw.qty)));
    if (!Number.isFinite(qty) || qty < 1) continue;
    const price = Number(raw.price);
    const item = { ...raw, id, size, qty, price: Number.isFinite(price) && price >= 0 ? price : 0 };
    const key = cartKey(id, size);
    const existing = seen.get(key);
    seen.set(key, existing ? { ...existing, qty: Math.min(MAX_QTY, existing.qty + qty) } : item);
  }
  return [...seen.values()];
}

export function reconcileCart(items, results) {
  const byKey = new Map((results || []).map((r) => [cartKey(r.id, r.size), r]));
  const notices = [];
  let changed = false;
  const next = [];

  for (const item of items) {
    const result = byKey.get(cartKey(item.id, item.size));
    if (!result) {
      next.push(item);
      continue;
    }
    const label = `${item.name || result.name || "Bir ürün"}${item.size ? ` (${item.size})` : ""}`;
    // Yalnız ürün ya da beden kaldırıldıysa satır çıkarılır. Stok az ya da sıfırsa satır ve
    // adet korunur: son adetler başka bir müşterinin ödeme adımında ayrılmış olabilir ve
    // ödeme olmazsa en geç 20 dakikada geri döner. Ödeme adımı stoğu yine sunucuda denetler.
    if (result.status === "missing" || result.status === "size_missing") {
      notices.push(`${label} artık satışta değil; sepetinizden çıkarıldı.`);
      changed = true;
      continue;
    }
    let updated = item;
    if (result.status === "insufficient") {
      notices.push(
        result.available > 0
          ? `${label}: şu an ${result.available} adet var. Ödemeye geçmek için adedi azaltın ya da biraz sonra tekrar deneyin.`
          : `${label} şu an stokta yok; son adetler başka bir müşterinin ödeme adımında olabilir. Biraz sonra tekrar deneyebilirsiniz.`
      );
    }
    if (Number.isFinite(result.price) && Math.abs(result.price - Number(item.price)) >= 0.005) {
      updated = { ...updated, price: result.price };
      notices.push(`${label}: fiyatı güncellendi.`);
    }
    if (updated !== item) changed = true;
    next.push(updated);
  }

  return { items: changed ? next : items, notices, changed };
}
