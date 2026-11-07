export const FAVORITES_KEY = "oldsocks.favorites.v1";
export const FAVORITES_EVENT = "oldsocks:favorites-change";
export const MAX_FAVORITES = 500;

const EMPTY_FAVORITES = Object.freeze([]);
let snapshot = EMPTY_FAVORITES;
let cachedRaw;
let memoryOnly = false;

function normalizeIds(values) {
  if (!Array.isArray(values)) return [];
  const ids = new Set();
  for (const value of values) {
    if (typeof value !== "string" && typeof value !== "number") continue;
    if (typeof value === "number" && !Number.isFinite(value)) continue;
    const id = String(value).trim();
    if (id && id.length <= 128) ids.add(id);
    if (ids.size >= MAX_FAVORITES) break;
  }
  return [...ids];
}

// A stable snapshot lets every card share the same list without fetching products.
export function getFavoriteIds() {
  if (typeof window === "undefined" || memoryOnly) return snapshot;
  try {
    const raw = window.localStorage.getItem(FAVORITES_KEY);
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      try {
        snapshot = normalizeIds(JSON.parse(raw));
      } catch {
        snapshot = EMPTY_FAVORITES;
      }
    }
  } catch {
    // Private browsing or denied storage still permits an in-memory list.
    memoryOnly = true;
  }
  return snapshot;
}

export function getServerFavoriteIds() {
  return EMPTY_FAVORITES;
}

function saveFavoriteIds(ids) {
  snapshot = normalizeIds(ids);
  cachedRaw = JSON.stringify(snapshot);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(FAVORITES_KEY, cachedRaw);
      memoryOnly = false;
    } catch {
      memoryOnly = true;
    }
    window.dispatchEvent(new Event(FAVORITES_EVENT));
  }
  return snapshot;
}

export function toggleFavorite(productId) {
  const [id] = normalizeIds([productId]);
  if (!id) return false;
  const current = getFavoriteIds();
  const exists = current.includes(id);
  saveFavoriteIds(exists ? current.filter((value) => value !== id) : [id, ...current]);
  return !exists;
}

export function removeFavorites(productIds) {
  const removed = new Set(normalizeIds(productIds));
  return saveFavoriteIds(getFavoriteIds().filter((id) => !removed.has(id)));
}

export function removeFavorite(productId) {
  return removeFavorites([productId]);
}

export function clearFavorites() {
  return saveFavoriteIds([]);
}

export function subscribeFavorites(onChange) {
  if (typeof window === "undefined") return () => {};
  const onStorage = (event) => {
    if (event.key !== FAVORITES_KEY && event.key !== null) return;
    memoryOnly = false;
    onChange();
  };
  window.addEventListener(FAVORITES_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(FAVORITES_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}
