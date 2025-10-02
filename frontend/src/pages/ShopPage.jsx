// src/pages/ShopPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BreadCrumb from "../components/breadCrumb/BreadCrumb";
import CategoryFilter from "../components/categories/CategoryFilter";
import Products from "../components/products/Products";
import api from "../../api";

export default function ShopPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  // Campaign (opsiyonel)
  const campaignItems = state?.campaignItems;
  const campaignTitle = state?.campaignTitle;
  const miniItems = state?.miniCampaignItems;
  const miniTitle = state?.miniCampaignTitle;

  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Header’dan gelen preset (kategori/alt kategori/indirim)
  const [presetTitle, setPresetTitle] = useState("");
  const [discountOnly, setDiscountOnly] = useState(false);
  const [discountProductIdSet, setDiscountProductIdSet] = useState(null); // Set<string> | null

  // lazy-load
  const [visibleCount, setVisibleCount] = useState(20);
  const browseRef = useRef(null);

  // Varsayılan filtreler
  const defaultFilters = {
    category: [],
    subCategory: [],
    sizes: [],
    colors: [],
    priceRange: [0, Infinity],
  };
  const [filters, setFilters] = useState(defaultFilters);

  /* 1) Kategoriler */
  useEffect(() => {
    api
      .get("/categories")
      .then(({ data }) => setCategories(data))
      .catch(console.error);
  }, []);

  /* 2) Ürünler (kampanya yoksa) */
  useEffect(() => {
    if (campaignItems || miniItems) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .get("/products")
      .then(({ data }) => setAllProducts(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [campaignItems, miniItems]);

  /* 3) Header preset */
  useEffect(() => {
    const preset = state?.preset || null;

    setPresetTitle(
      preset?.title || (preset?.discountOnly ? "İndirimdekiler" : "") || ""
    );

    setDiscountOnly(Boolean(preset?.discountOnly));

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
  const baseList = miniItems || campaignItems || allProducts;

  /* 5) Kampanya varsa priceRange ayarla */
  useEffect(() => {
    if (!(campaignItems || miniItems)) return;
    const prices = baseList.map((p) => Number(p.price || 0));
    const min = prices.length ? Math.min(...prices) : 0;
    const max = prices.length ? Math.max(...prices) : 0;
    setFilters((f) => ({ ...f, priceRange: [min, max] }));
  }, [baseList, campaignItems, miniItems]);

  /* 6) Listeyi filtrele (normalize’larla) */
  const filtered = baseList.filter((p) => {
    const cat =
      typeof p.category === "object"
        ? String(p.category._id)
        : String(p.category);
    const parent =
      typeof p.category === "object" && p.category.parent
        ? String(p.category.parent._id || p.category.parent)
        : null;

    // Belirli indirim → sadece o indirimin ürünleri
    if (discountProductIdSet) {
      if (!discountProductIdSet.has(String(p._id))) return false;
    }

    // Genel "İndirimdekiler"
    if (!discountProductIdSet && discountOnly) {
      const rate = Number(p.discount || 0);
      if (!(rate > 0)) return false; // toplu indirimler product.discount’a yazılıyor
    }

    // Alt kategori > kategori
    if (filters.subCategory.length) {
      if (!filters.subCategory.map(String).includes(cat)) return false;
    } else if (filters.category.length) {
      const cats = filters.category.map(String);
      if (!cats.includes(cat) && !(parent && cats.includes(parent)))
        return false;
    }

    // Beden
    if (filters.sizes.length) {
      const sizeStrs = Array.isArray(p.sizes)
        ? p.sizes
            .map((s) => String((s?.size ?? s ?? "").toString().trim()))
            .filter(Boolean)
        : [];
      const ok = sizeStrs.some((s) => filters.sizes.includes(s));
      if (!ok) return false;
    }

    // Renk
    if (filters.colors.length) {
      const color = String((p.color || "").trim());
      if (!filters.colors.includes(color)) return false;
    }

    // Fiyat aralığı
    const [low, high] = filters.priceRange;
    const price = Number(p.price || 0);
    if (price < low || price > high) return false;

    return true;
  });

  /* 7) Kampanya/preset temizleme */
  const clearCampaign = () => {
    navigate("/shop", { replace: true, state: {} });
    setFilters(defaultFilters);
    setDiscountOnly(false);
    setDiscountProductIdSet(null);
    setPresetTitle("");
    setVisibleCount(20);
  };

  if (loading) return <div className="py-10 text-center">Yükleniyor…</div>;

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
          <header className="mb-6">
            <h1 className="text-4xl font-playfair font-bold text-black">
              {presetTitle || miniTitle || campaignTitle || ""}
            </h1>
          </header>

          <Products products={filtered.slice(0, visibleCount)} />

          {visibleCount < filtered.length &&
            !(presetTitle || miniTitle || campaignTitle) && (
              <div ref={browseRef} className="mt-10 text-center">
                <button
                  className="px-6 py-2 border border-dark1 text-dark1 rounded-full hover:bg-dark1 hover:text-white transition"
                  onClick={() => {
                    setVisibleCount((prev) => prev + 20);
                    setTimeout(() => {
                      browseRef.current?.scrollIntoView({ behavior: "smooth" });
                    }, 100);
                  }}
                >
                  Browse More
                </button>
              </div>
            )}
        </section>
      </main>
    </div>
  );
}
