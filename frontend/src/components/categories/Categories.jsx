// src/components/Categories.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api";
import CategoryItem from "./CategoryItem";

const PAGE_SIZE = 4;

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/categories")
      .then((res) => {
        const roots = res.data.filter((c) => c.parent === null);
        // sıralı — random yok
        roots.sort((a, b) => a.name.localeCompare(b.name, "tr"));
        setCategories(roots);
        setPage(0);
      })
      .catch((err) => console.error("Kategoriler getirilirken hata:", err))
      .finally(() => setLoading(false));
  }, []);

  const totalPages = Math.max(1, Math.ceil(categories.length / PAGE_SIZE));

  const pageItems = useMemo(() => {
    const start = page * PAGE_SIZE;
    return categories.slice(start, start + PAGE_SIZE);
  }, [categories, page]);

  const goPrev = () => setPage((p) => Math.max(0, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages - 1, p + 1));
  const goTo = (i) => setPage(i);

  if (loading) {
    return (
      <section className="bg-light2 py-10 text-center">
        Kategoriler yükleniyor…
      </section>
    );
  }

  if (categories.length === 0) {
    return (
      <section className="bg-light2 py-10 text-center">
        Kategori bulunamadı.
      </section>
    );
  }

  return (
    <section className="bg-light2/60 backdrop-blur-sm py-10">
      <div className="container mx-auto px-4">
        {/* GRID + animasyon */}
        <div
          key={page} // page değiştikçe fade/slide tetikler
          className="grid grid-cols-2 sm:grid-cols-4 gap-6 
                     transition-all duration-500 ease-in-out 
                     animate-fadeSlide"
        >
          {pageItems.map((c) => (
            <CategoryItem
              key={c._id}
              image={c.image}
              alt={c.name}
              onClick={() =>
                navigate("/shop", {
                  state: { preset: { category: [c._id], subCategory: [] } },
                })
              }
            />
          ))}
        </div>

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={goPrev}
                disabled={page === 0}
                className={`px-3 py-2 rounded-lg border text-sm transition ${
                  page === 0
                    ? "text-gray-400 border-gray-200 cursor-not-allowed bg-white"
                    : "text-gray-700 border-gray-300 hover:bg-gray-50 bg-white"
                }`}
              >
                ← Önceki
              </button>
              <button
                onClick={goNext}
                disabled={page === totalPages - 1}
                className={`px-3 py-2 rounded-lg border text-sm transition ${
                  page === totalPages - 1
                    ? "text-gray-400 border-gray-200 cursor-not-allowed bg-white"
                    : "text-gray-700 border-gray-300 hover:bg-gray-50 bg-white"
                }`}
              >
                Sonraki →
              </button>
            </div>

            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`h-2.5 w-2.5 rounded-full transition ${
                    i === page
                      ? "bg-gray-900 scale-110"
                      : "bg-gray-300 hover:bg-gray-400"
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tailwind’e küçük animasyon ekleyelim */}
      <style>{`
        @keyframes fadeSlide {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeSlide {
          animation: fadeSlide 0.4s ease-in-out;
        }
      `}</style>
    </section>
  );
}
