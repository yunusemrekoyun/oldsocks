import React, { useState, useEffect } from "react";
import api from "../../../api";
import ProductGridItem from "./ProductGridItem";

/* Seed'li PRNG (mulberry32) */
function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/* Seed'li shuffle (Fisher–Yates) */
function shuffleWithSeed(arr, seed) {
  const a = arr.slice();
  const rand = mulberry32(
    // string/number seed kabul et
    typeof seed === "number"
      ? seed
      : Array.from(String(seed || "default")).reduce(
          (s, c) => s + c.charCodeAt(0),
          0
        )
  );
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function ProductGrid({ limit = 4, seed = "default" }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api
      .get("/products")
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        const shuffled = shuffleWithSeed(list, seed);
        const picked = shuffled.slice(0, Math.max(0, limit));
        if (alive) setProducts(picked);
      })
      .catch((err) => console.error("Ürünler getirilirken hata:", err))
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [seed, limit]); // seed değişirse farklı set üret

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
