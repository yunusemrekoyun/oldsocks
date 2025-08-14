// src/components/Categories.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";   // ← EKLE
import api from "../../../api";
import CategoryItem from "./CategoryItem";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();                 // ← EKLE

  useEffect(() => {
    api
      .get("/categories")
      .then((res) => {
        const roots = res.data.filter((c) => c.parent === null);
        const randomFour = roots.sort(() => Math.random() - 0.5).slice(0, 4);
        setCategories(randomFour);
      })
      .catch((err) => console.error("Kategoriler getirilirken hata:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="bg-light2 py-10 text-center">
        Kategoriler yükleniyor…
      </section>
    );
  }

  return (
    <section className="bg-light2/60 backdrop-blur-sm py-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {categories.map((c) => (
            <CategoryItem
              key={c._id}
              image={c.image}
              alt={c.name}
              onClick={() => {
                // → /shop’a, bu kategori preset seçili gönder
                navigate("/shop", {
                  state: { preset: { category: [c._id], subCategory: [] } },
                });
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}