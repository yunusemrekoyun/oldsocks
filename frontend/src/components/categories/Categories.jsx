import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api";
import CategoryItem from "./CategoryItem";

const PAGE_SIZE_DESKTOP = 4;
const PAGE_SIZE_MOBILE = 2;
const AUTO_SCROLL_DELAY = 7000;

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const isMobile = window.innerWidth < 640;
  const PAGE_SIZE = isMobile ? PAGE_SIZE_MOBILE : PAGE_SIZE_DESKTOP;
  const totalPages = Math.max(1, Math.ceil(categories.length / PAGE_SIZE));

  // Kategorileri çek
  useEffect(() => {
    api
      .get("/categories")
      .then((res) => {
        const roots = res.data.filter((c) => c.parent === null);
        roots.sort((a, b) => a.name.localeCompare(b.name, "tr"));
        setCategories(roots);
        setPage(0);
      })
      .catch((err) => console.error("Kategoriler getirilirken hata:", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage((prev) => (prev + 1) % totalPages);
    }, AUTO_SCROLL_DELAY);

    return () => clearTimeout(timeout);
  }, [page, totalPages]);

  // Sayfa scroll davranışı
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({
      left: el.clientWidth * page,
      behavior: "smooth",
    });
  }, [page]);

  // Swipe hareketi ile geçiş
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let startX = 0;

    const handleTouchStart = (e) => (startX = e.touches[0].clientX);
    const handleTouchEnd = (e) => {
      const deltaX = e.changedTouches[0].clientX - startX;
      if (deltaX > 50) {
        setPage((prev) => Math.max(0, prev - 1));
      } else if (deltaX < -50) {
        setPage((prev) => Math.min(totalPages - 1, prev + 1));
      }
    };

    let mouseDown = false;
    const handleMouseDown = (e) => {
      mouseDown = true;
      startX = e.clientX;
    };
    const handleMouseUp = (e) => {
      if (!mouseDown) return;
      mouseDown = false;
      const deltaX = e.clientX - startX;
      if (deltaX > 50) {
        setPage((prev) => Math.max(0, prev - 1));
      } else if (deltaX < -50) {
        setPage((prev) => Math.min(totalPages - 1, prev + 1));
      }
    };

    el.addEventListener("touchstart", handleTouchStart);
    el.addEventListener("touchend", handleTouchEnd);
    el.addEventListener("mousedown", handleMouseDown);
    el.addEventListener("mouseup", handleMouseUp);

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchend", handleTouchEnd);
      el.removeEventListener("mousedown", handleMouseDown);
      el.removeEventListener("mouseup", handleMouseUp);
    };
  }, [totalPages]);

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

  // Sayfa sayfa slide'ları oluştur
  const slides = [];
  for (let i = 0; i < totalPages; i++) {
    const slice = categories.slice(i * PAGE_SIZE, (i + 1) * PAGE_SIZE);
    slides.push(slice);
  }

  return (
    <section className="bg-light2/60 backdrop-blur-sm py-10">
      <div className="container mx-auto px-4 overflow-hidden">
        <div
          ref={containerRef}
          className="flex transition-all duration-500 ease-in-out no-scrollbar"
          style={{ scrollSnapType: "x mandatory", overflowX: "auto" }}
        >
          {slides.map((group, idx) => (
            <div
              key={idx}
              className="min-w-full snap-start grid grid-cols-2 sm:grid-cols-4 gap-6 px-1"
            >
              {group.map((c) => (
                <div key={c._id} className="select-none">
                  <CategoryItem
                    image={c.image}
                    alt={c.name}
                    onClick={() =>
                      navigate("/shop", {
                        state: {
                          preset: { category: [c._id], subCategory: [] },
                        },
                      })
                    }
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .select-none img {
          user-drag: none;
          -webkit-user-drag: none;
          pointer-events: none;
        }
      `}</style>
    </section>
  );
}
