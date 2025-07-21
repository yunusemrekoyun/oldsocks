import React, { useState, useEffect } from "react";
import BreadCrumb from "../components/breadCrumb/BreadCrumb";
import CategoryFilter from "../components/categories/CategoryFilter";
import Products from "../components/products/Products";
import Categories from "../components/categories/Categories";
import api from "../../api";

export default function ShopPage() {
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1) İlk yüklemede ürünleri & kategorileri çek
  useEffect(() => {
    Promise.all([api.get("/products"), api.get("/categories")])
      .then(([pRes, cRes]) => {
        setAllProducts(pRes.data);
        setCategories(cRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Dinamik min/max
  const prices = allProducts.map((p) => p.price);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;

  // 2) Filtreleri localStorage’dan oku veya default
  const [filters, setFilters] = useState(() => {
    try {
      return (
        JSON.parse(localStorage.getItem("shopFilters")) || {
          category: [],
          subCategory: [],
          sizes: [],
          colors: [],
          priceRange: [minPrice, maxPrice],
        }
      );
    } catch {
      return {
        category: [],
        subCategory: [],
        sizes: [],
        colors: [],
        priceRange: [minPrice, maxPrice],
      };
    }
  });

  // 3) Filtre değişince kalıcı sakla
  useEffect(() => {
    localStorage.setItem("shopFilters", JSON.stringify(filters));
  }, [filters]);

  // 4) Ürünleri filtrele
  const filtered = allProducts.filter((p) => {
    const cat = p.category;
    const catId = cat && typeof cat === "object" ? cat._id : cat;
    const parentRaw = cat && typeof cat === "object" ? cat.parent : null;
    const parentId =
      parentRaw && typeof parentRaw === "object" ? parentRaw._id : parentRaw;

    if (filters.subCategory.length > 0) {
      if (!filters.subCategory.includes(catId)) return false;
    } else if (filters.category.length > 0) {
      if (
        !filters.category.includes(catId) &&
        !filters.category.includes(parentId)
      )
        return false;
    }
    if (
      filters.sizes.length > 0 &&
      !p.sizes.some((s) => filters.sizes.includes(s))
    )
      return false;
    if (filters.colors.length > 0 && !filters.colors.includes(p.color))
      return false;
    const [low, high] = filters.priceRange;
    if (p.price < low || p.price > high) return false;
    return true;
  });

  if (loading) return <div className="text-center py-10">Yükleniyor…</div>;

  return (
    <div className="bg-white text-dark1">
      <BreadCrumb />
      <main className="container mx-auto px-4 py-14 grid grid-cols-1 lg:grid-cols-4 gap-10">
        <aside className="lg:col-span-1 bg-light1 rounded-xl p-6 shadow-sm">
          <CategoryFilter
            products={allProducts}
            categories={categories}
            filters={filters}
            onFilterChange={setFilters}
          />
        </aside>

        <section className="lg:col-span-3">
          <header className="mb-6">
            <h1 className="text-4xl font-playfair font-bold text-black">
              Shop with us
            </h1>
            <p className="text-dark2 text-sm mt-1">
              Browse from {filtered.length} items
            </p>
          </header>
          <Products products={filtered} />
          <div className="mt-10 text-center">
            <button className="px-6 py-2 border border-dark1 text-dark1 rounded-full hover:bg-dark1 hover:text-white transition">
              Browse More
            </button>
          </div>
        </section>
      </main>
      <Categories />
    </div>
  );
}
