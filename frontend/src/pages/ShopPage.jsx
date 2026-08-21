// src/pages/ShopPage.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import BreadCrumb from "../components/breadCrumb/BreadCrumb";
import CategoryFilter from "../components/categories/CategoryFilter";
import Products from "../components/products/Products";
import api from "../../api";
import useProductsCache from "../hooks/useProductsCache";
import useCategoriesCache from "../hooks/useCategoriesCache";
import { buildVariantColorMap } from "../utils/productVariants";

const SORT_OPTIONS = [
  { value: "newest", label: "Tarihe Göre: En Yeni" },
  { value: "oldest", label: "Tarihe Göre: En Eski" },
  { value: "priceDesc", label: "Fiyata Göre: En Yüksek" },
  { value: "priceAsc", label: "Fiyata Göre: En Düşük" },
];

export default function ShopPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  // Campaign (opsiyonel)
  const campaignItems = state?.campaignItems;
  const campaignTitle = state?.campaignTitle;
  const miniItems = state?.miniCampaignItems;
  const miniTitle = state?.miniCampaignTitle;

  const { data: cachedProducts, loading: productsLoading } = useProductsCache();
  const { data: cachedCategories, loading: categoriesLoading } =
    useCategoriesCache();

  // Header’dan gelen preset (kategori/alt kategori/indirim)
  const [presetTitle, setPresetTitle] = useState("");
  const [discountOnly, setDiscountOnly] = useState(false);
  const [discountProductIdSet, setDiscountProductIdSet] = useState(null); // Set<string> | null
  const [presetProductIdSet, setPresetProductIdSet] = useState(null); // Set<string> | null

  // lazy-load
  const [visibleCount, setVisibleCount] = useState(20);

  // Varsayılan filtreler
  const defaultFilters = {
    category: [],
    subCategory: [],
    sizes: [],
    colors: [],
    priceRange: [0, Infinity],
  };
  const [filters, setFilters] = useState(defaultFilters);
  const [sortBy, setSortBy] = useState("newest");

  /* 3) Header preset */
  useEffect(() => {
    const preset = state?.preset || null;

    setPresetTitle(
      preset?.title || (preset?.discountOnly ? "İndirimdekiler" : "") || ""
    );

    setDiscountOnly(Boolean(preset?.discountOnly));
    setPresetProductIdSet(
      Array.isArray(preset?.productIds)
        ? new Set(preset.productIds.map(String))
        : null
    );

    setFilters((f) => ({
      ...f,
      category: Array.isArray(preset?.category)
        ? preset.category.map(String)
        : [],
      subCategory: Array.isArray(preset?.subCategory)
        ? preset.subCategory.map(String)
        : [],
    }));

    setVisibleCount(20);

    if (preset?.discountId) {
      (async () => {
        try {
          const { data } = await api.get(`/discounts/${preset.discountId}`);
          const ids = (data?.appliedProducts || []).map((ap) =>
            typeof ap.product === "object" ? ap.product._id : ap.product
          );
          setDiscountProductIdSet(new Set(ids.map(String)));
        } catch (e) {
          console.error("İndirim bilgisi alınamadı:", e);
          setDiscountProductIdSet(new Set()); // boş set → sonuç yok
        }
      })();
    } else {
      setDiscountProductIdSet(null);
    }
  }, [state?.preset]);

  /* 4) Hangi liste? */
  const allProducts = useMemo(
    () => (Array.isArray(cachedProducts) ? cachedProducts : []),
    [cachedProducts]
  );
  const categories = useMemo(
    () => (Array.isArray(cachedCategories) ? cachedCategories : []),
    [cachedCategories]
  );
  const baseList = miniItems || campaignItems || allProducts;
  const pageLoading =
    campaignItems || miniItems ? false : productsLoading || categoriesLoading;
  const variantColorMap = useMemo(
    () => buildVariantColorMap(allProducts),
    [allProducts]
  );

  /* 5) Kampanya varsa priceRange ayarla */
  useEffect(() => {
    if (!(campaignItems || miniItems)) return;
    const prices = baseList.map((p) => Number(p.price || 0));
    const min = prices.length ? Math.min(...prices) : 0;
    const max = prices.length ? Math.max(...prices) : 0;
    setFilters((f) => ({ ...f, priceRange: [min, max] }));
  }, [baseList, campaignItems, miniItems]);

  /* 6) Listeyi filtrele (normalize’larla) */
  const filtered = useMemo(
    () =>
      baseList.filter((p) => {
        const cat =
          typeof p.category === "object"
            ? String(p.category._id)
            : String(p.category);
        const parent =
          typeof p.category === "object" && p.category.parent
            ? String(p.category.parent._id || p.category.parent)
            : null;

        if (discountProductIdSet && !discountProductIdSet.has(String(p._id))) {
          return false;
        }

        if (presetProductIdSet && !presetProductIdSet.has(String(p._id))) {
          return false;
        }

        if (!discountProductIdSet && discountOnly) {
          const rate = Number(p.discount || 0);
          if (!(rate > 0)) return false;
        }

        if (filters.subCategory.length) {
          if (!filters.subCategory.map(String).includes(cat)) return false;
        } else if (filters.category.length) {
          const cats = filters.category.map(String);
          if (!cats.includes(cat) && !(parent && cats.includes(parent))) {
            return false;
          }
        }

        if (filters.sizes.length) {
          const sizeStrs = Array.isArray(p.sizes)
            ? p.sizes
                .map((s) => String((s?.size ?? s ?? "").toString().trim()))
                .filter(Boolean)
            : [];
          const ok = sizeStrs.some((s) => filters.sizes.includes(s));
          if (!ok) return false;
        }

        if (filters.colors.length) {
          const color = String((p.color || "").trim());
          if (!filters.colors.includes(color)) return false;
        }

        const [low, high] = filters.priceRange;
        const price = Number(p.price || 0);
        if (price < low || price > high) return false;

        return true;
      }),
    [baseList, discountOnly, discountProductIdSet, filters, presetProductIdSet]
  );

  const sortedProducts = useMemo(() => {
    const list = [...filtered];

    const getTimestamp = (product) => {
      const createdAt = product?.createdAt
        ? new Date(product.createdAt).getTime()
        : NaN;
      if (Number.isFinite(createdAt)) return createdAt;

      const objectIdTime = parseInt(String(product?._id || "").slice(0, 8), 16);
      return Number.isFinite(objectIdTime) ? objectIdTime * 1000 : 0;
    };

    list.sort((a, b) => {
      if (sortBy === "priceAsc") return Number(a.price || 0) - Number(b.price || 0);
      if (sortBy === "priceDesc") return Number(b.price || 0) - Number(a.price || 0);

      const timeA = getTimestamp(a);
      const timeB = getTimestamp(b);

      return sortBy === "oldest" ? timeA - timeB : timeB - timeA;
    });

    return list;
  }, [filtered, sortBy]);

  /* 7) Kampanya/preset temizleme */
  const clearCampaign = () => {
    navigate("/shop", { replace: true, state: {} });
    setFilters(defaultFilters);
    setDiscountOnly(false);
    setDiscountProductIdSet(null);
    setPresetProductIdSet(null);
    setPresetTitle("");
    setVisibleCount(20);
  };

  if (pageLoading) return <div className="py-10 text-center">Yükleniyor…</div>;

  return (
    <div className="bg-white text-dark1">
      <BreadCrumb />

      <main className="container mx-auto px-4 py-14 grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* SOL: Filtre */}
        <aside className="lg:col-span-1 bg-transparent rounded-xl p-6 shadow-sm">
          <CategoryFilter
            products={filtered}
            categories={categories}
            filters={filters}
            onFilterChange={(next) => {
              setFilters(next);
              setVisibleCount(20);
            }}
            campaignTitle={presetTitle || miniTitle || campaignTitle || ""}
            onClearCampaign={clearCampaign}
          />
        </aside>

        {/* SAĞ: Ürünler */}
        <section className="lg:col-span-3">
          <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <h1 className="text-4xl font-playfair font-bold text-black">
                {presetTitle || miniTitle || campaignTitle || "Tüm Ürünler"}
              </h1>
              <p className="mt-2 text-sm text-dark2">
                {sortedProducts.length} ürün listeleniyor
              </p>
            </div>

            <div className="w-full md:w-auto rounded-2xl border border-light2 bg-white px-4 py-3 shadow-sm">
              <label
                htmlFor="shop-sort"
                className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.22em] text-dark2"
              >
                Sıralama
              </label>
              <div className="relative">
                <select
                  id="shop-sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full appearance-none rounded-full border border-light2 bg-light1 px-4 py-2.5 pr-10 text-sm font-medium text-dark1 outline-none transition focus:border-dark1 md:min-w-[260px]"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dark2" />
              </div>
            </div>
          </header>

          <Products
            products={sortedProducts.slice(0, visibleCount)}
            variantColorMap={variantColorMap}
          />

          {visibleCount < sortedProducts.length && !(campaignItems || miniItems) && (
            <div className="mt-10 text-center">
              <button
                className="px-6 py-2 border border-dark1 text-dark1 rounded-full hover:bg-dark1 hover:text-white transition"
                onClick={() => setVisibleCount((prev) => prev + 20)}
              >
                Daha Fazla Yükle
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
