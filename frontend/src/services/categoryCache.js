import api from "../../api";

let cache = null;
let timestamp = 0;
let inFlight = null;

const TTL = 60 * 1000; // 60 saniye

export async function getCategoriesCached(force = false) {
  const now = Date.now();
  if (!force && cache && now - timestamp < TTL) {
    return cache;
  }

  if (inFlight) {
    return inFlight;
  }

  inFlight = api
    .get("/categories")
    .then((res) => {
      const data = Array.isArray(res.data) ? res.data : [];
      cache = data;
      timestamp = Date.now();
      return cache;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

export function clearCategoriesCache() {
  cache = null;
  timestamp = 0;
}
