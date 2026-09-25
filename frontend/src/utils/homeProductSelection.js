function timestamp(product) {
  if (product.createdAt) return new Date(product.createdAt).getTime() || 0;
  return Number.parseInt(String(product._id || "").slice(0, 8), 16) * 1000 || 0;
}

function shuffle(items, random) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
}

export function selectHomeProducts(products, section, bestSellingIds = [], random = Math.random) {
  const all = Array.isArray(products) ? products : [];
  const config = section || {};
  const byId = new Map(all.map((product) => [String(product._id), product]));
  let candidates;

  switch (config.source) {
    case "manual":
      candidates = (config.productIds || []).map((id) => byId.get(String(id))).filter(Boolean);
      break;
    case "category":
      candidates = all.filter((product) => {
        const category = product.category;
        const id = typeof category === "object" ? category?._id : category;
        const parent = typeof category === "object" ? category?.parent?._id : null;
        return [id, parent].some((value) => String(value || "") === String(config.categoryId));
      }).sort((a, b) => timestamp(b) - timestamp(a));
      break;
    case "best_selling":
      candidates = bestSellingIds.map((id) => byId.get(String(id))).filter(Boolean);
      break;
    case "random":
      candidates = all;
      break;
    case "latest":
    default:
      candidates = [...all].sort((a, b) => timestamp(b) - timestamp(a)).slice(0, 10);
  }

  const shouldShuffle = config.shuffle || config.source === "random";
  return (shouldShuffle ? shuffle(candidates, random) : candidates).slice(0, 4);
}
