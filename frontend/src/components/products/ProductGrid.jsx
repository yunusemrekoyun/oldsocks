import React, { useState, useEffect } from "react";
import api from "../../../api";
import ProductGridItem from "./ProductGridItem";

export default function ProductGrid() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/products")
      .then((res) => {
        // sadece ilk 4 ürün
        const list = Array.isArray(res.data) ? res.data : [];
        setProducts(list.slice(0, 4));
      })
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
              price={Number(p.price || 0)}
              originalPrice={Number(p.originalPrice || 0)}
              discount={Number(p.discount || 0)}
              stock={
                Array.isArray(p.sizes)
                  ? p.sizes.reduce((sum, s) => sum + (s.stock || 0), 0)
                  : 0
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}
