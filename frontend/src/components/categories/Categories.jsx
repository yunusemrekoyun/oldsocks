// src/components/Categories.jsx
import React, { useState, useEffect } from "react";
import api from "../../../api";
import CategoryItem from "./CategoryItem";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/categories")
      .then((res) => {
        const roots = res.data.filter((c) => c.parent === null);
        setCategories(roots);
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
    <section className="bg-light2 py-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {categories.map((c) => (
            <CategoryItem
              key={c._id}
              image={c.image}
              alt={c.name}
              onClick={() => {
                // İleride kategori sayfasına yönlendirme ekleyebilirsiniz:
                // navigate(`/category/${c._id}`);
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
