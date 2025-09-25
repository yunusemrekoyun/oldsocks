// src/components/products/ProductGrid.jsx
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

  // Kart için fiyat verilerini normalize et
  const toCardPricing = (p) => {
    const final = Number(p.price ?? 0); // backend'in final fiyatı
    const original = Number(p.originalPrice ?? 0);

    const hasDiscount = original > 0 && final > 0 && final < original;
    const computedRate = hasDiscount
      ? Math.round(100 - (final / original) * 100)
      : 0;

    return {
      price: hasDiscount ? original : final, // üstü çizilecek fiyat
      discountedPrice: hasDiscount ? final : null, // indirimli fiyat
      discountRate: hasDiscount ? computedRate : 0, // rozet için
    };
  };

  return (
    <section className="bg-light1 py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-center font-playfair text-3xl md:text-4xl text-black uppercase mb-8">
          Öne Çıkan Ürünler
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {products.map((p) => {
            const { price, discountedPrice, discountRate } = toCardPricing(p);

            const posterUrl =
              p.poster || (Array.isArray(p.images) ? p.images[0] : null);

            const stock = Array.isArray(p.sizes)
              ? p.sizes.reduce((sum, s) => sum + (s.stock || 0), 0)
              : 0;

            return (
              <ProductGridItem
                key={p._id}
                id={p._id}
                video={p.video}
                poster={posterUrl}
                name={p.name}
                price={price}
                discountedPrice={discountedPrice}
                discountRate={discountRate}
                stock={stock}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
