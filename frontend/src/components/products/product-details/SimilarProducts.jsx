import React, { useState, useEffect } from "react";
import api from "../../../../api";
import SimilarProductItem from "./SimilarProductsItem";

export default function SimilarProducts({ categoryId, currentProductId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!categoryId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .get("/products")
      .then(({ data }) => {
        // aynı kategoridekiler
        const sameCat = data.filter(
          (p) =>
            (p.category && p.category._id === categoryId) ||
            p.category === categoryId
        );
        // kendisini çıkar
        const filtered = sameCat.filter((p) => p._id !== currentProductId);
        // karıştırıp 3 al
        for (let i = filtered.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
        }
        setItems(filtered.slice(0, 3));
        setError("");
      })
      .catch(() => {
        setError("Benzer ürünler yüklenemedi.");
      })
      .finally(() => setLoading(false));
  }, [categoryId, currentProductId]);

  if (loading)
    return <div className="text-center py-4">Benzer ürünler yükleniyor…</div>;
  if (error)
    return <div className="text-center py-4 text-red-600">{error}</div>;
  if (items.length === 0)
    return <div className="text-center py-4">Benzer ürün bulunamadı.</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Benzer Ürünler</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {items.map((p) => (
          <SimilarProductItem
            key={p._id}
            id={p._id}
            video={p.video}
            name={p.name}
            price={p.price}
            rating={5}
          />
        ))}
      </div>
    </div>
  );
}
