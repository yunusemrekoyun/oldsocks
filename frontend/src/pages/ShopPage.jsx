import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BreadCrumb from "../components/breadCrumb/BreadCrumb";
import CategoryFilter from "../components/categories/CategoryFilter";
import Products from "../components/products/Products";
import Categories from "../components/categories/Categories";
import api from "../../api";

export default function ShopPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  // Campaign (normal)
  const campaignItems = state?.campaignItems;
  const campaignTitle = state?.campaignTitle;
  // Mini campaign
  const miniItems = state?.miniCampaignItems;
  const miniTitle = state?.miniCampaignTitle;

  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Gösterilecek ürün sayısı (lazy load)
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

  // 1) Kategorileri çek
  useEffect(() => {
    api
      .get("/categories")
      .then(({ data }) => setCategories(data))
      .catch(console.error);
  }, []);

  // 2) Ürünleri (kampanya yoksa) çek
  useEffect(() => {
    if (campaignItems || miniItems) {
      setLoading(false);
      return;
    }
    api
      .get("/products")
      .then(({ data }) => setAllProducts(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [campaignItems, miniItems]);

  // 3) Header’dan preset geldiyse filtrelere uygula
  useEffect(() => {
    if (state?.preset) {
      const { category = [], subCategory = [] } = state.preset || {};
      setFilters((f) => ({
        ...f,
        category: Array.isArray(category) ? category : [],
        subCategory: Array.isArray(subCategory) ? subCategory : [],
      }));
      setVisibleCount(20);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.preset]);

  // 4) Hangi liste?
  const baseList = miniItems || campaignItems || allProducts;
  const title = miniTitle || campaignTitle || "";

  // 5) Kampanya varsa priceRange ayarla
  useEffect(() => {
    const prices = baseList.map((p) => p.price);
    const min = prices.length ? Math.min(...prices) : 0;
    const max = prices.length ? Math.max(...prices) : 0;
    if (campaignItems || miniItems) {
      setFilters((f) => ({ ...f, priceRange: [min, max] }));
    }
  }, [baseList, campaignItems, miniItems]);

  // 6) Filtrele
  const filtered = baseList.filter((p) => {
    const cat = typeof p.category === "object" ? p.category._id : p.category;
    const parent =
      typeof p.category === "object" && p.category.parent
        ? p.category.parent._id
        : null;

    if (filters.subCategory.length) {
      if (!filters.subCategory.includes(cat)) return false;
    } else if (filters.category.length) {
      if (!filters.category.includes(cat) && !filters.category.includes(parent))
        return false;
    }
    if (filters.sizes.length && !p.sizes?.some((s) => filters.sizes.includes(s)))
      return false;
    if (filters.colors.length && !filters.colors.includes(p.color)) return false;

    const [low, high] = filters.priceRange;
    if (p.price < low || p.price > high) return false;

    return true;
  });

  // 7) Kampanya filtresini temizle
  const clearCampaign = () => {
    navigate("/shop", { replace: true, state: {} });
    setFilters(defaultFilters);
    setVisibleCount(20);
  };

  if (loading) return <div className="py-10 text-center">Yükleniyor…</div>;

  return (
    <div className="bg-white text-dark1">
      <BreadCrumb />

      <main className="container mx-auto px-4 py-14 grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* SOL: Filtre */}
        <aside className="lg:col-span-1 bg-transparent rounded-xl p-0 lg:p-0">
          <CategoryFilter
            products={filtered}
            categories={categories}
            filters={filters}
            onFilterChange={(next) => {
              setFilters(next);
              setVisibleCount(20); // filtre değişince başa al
            }}
            campaignTitle={title}
            onClearCampaign={clearCampaign}
          />
        </aside>

        {/* SAĞ: Ürünler */}
        <section className="lg:col-span-3">
          <header className="mb-6">
            {!!title && (
              <h1 className="text-4xl font-playfair font-bold text-black">
                {title}
              </h1>
            )}
            <p className="text-dark2 text-sm mt-1">
              {filtered.length} ürün listeleniyor
            </p>
          </header>

          {/* Ürünler (20’lik dilimler) */}
          <Products products={filtered.slice(0, visibleCount)} />

          {/* Browse More */}
          {visibleCount < filtered.length && !title && (
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

      <Categories />
    </div>
  );
}