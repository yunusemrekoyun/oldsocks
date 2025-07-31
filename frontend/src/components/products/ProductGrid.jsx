// src/components/ProductGrid.jsx
import React, { useState, useEffect } from "react";
import api from "../../../api";
import ProductGridItem from "./ProductGridItem";

export default function ProductGrid() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/products")
      .then((res) => setProducts(res.data))
      .catch((err) => console.error("Ürünler getirilirken hata:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="bg-light1 py-12 text-center">
        Ürünler yükleniyor…
      </section>
    );
  }

  return (
    <section className="bg-light1 py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-center font-playfair text-3xl md:text-4xl text-black uppercase mb-8">
Öne Çıkan Ürünler
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {products.map((p) => (
            <ProductGridItem
              key={p._id}
              id={p._id}
              video={p.video}
              poster={p.poster}
              name={p.name}
              price={p.price}
              rating={5}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
