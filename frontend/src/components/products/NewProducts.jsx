// src/components/products/NewProducts.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../../../api";
import NewProductItem from "./NewProductItem";

// createdAt yoksa ObjectId'den zaman türet (Mongo ObjectId ilk 4 byte epoch seconds)
const getCreatedMs = (p) => {
  if (p?.createdAt) {
    const t = new Date(p.createdAt).getTime();
    if (!Number.isNaN(t)) return t;
  }
  if (typeof p?._id === "string" && p._id.length >= 8) {
    const secs = parseInt(p._id.slice(0, 8), 16);
    if (!Number.isNaN(secs)) return secs * 1000;
  }
  return 0;
};

// Kart için fiyat normalize edici (tek kaynak)
const toCardPricing = (p) => {
  const final = Number(p.price ?? 0); // backend final fiyat
  const original = Number(p.originalPrice ?? 0);

  const hasDiscount = original > 0 && final > 0 && final < original;
  const discountRate = hasDiscount
    ? Math.round(100 - (final / original) * 100)
    : 0;

  return {
    price: hasDiscount ? original : final, // üstü çizilecek (orijinal) ya da final
    discountedPrice: hasDiscount ? final : null, // indirimli fiyat varsa gönder
    discountRate, // rozet için yüzde
  };
};

export default function NewProducts() {
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tek istek, hafif state
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await api.get("/products");
        if (alive) setAll(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Ürünler alınamadı:", err);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const now = Date.now();
  const WEEK = 7 * 24 * 60 * 60 * 1000;

  // 2 → 3 → 4 hafta pencerelerini deneyip ilk dolu olanı al; sonra en yeni 4 taneyi göster
  const items = useMemo(() => {
    const sortDesc = (arr) =>
      arr.sort((a, b) => getCreatedMs(b) - getCreatedMs(a));
    const inLast = (weeks) =>
      sortDesc(
        all.filter((p) => {
          const t = getCreatedMs(p);
          return t > 0 && now - t <= weeks * WEEK;
        })
      );

    const two = inLast(2);
    if (two.length) return two.slice(0, 4);

    const three = inLast(3);
    if (three.length) return three.slice(0, 4);

    const four = inLast(4);
    if (four.length) return four.slice(0, 4);

    // 4 haftada da hiç yoksa boş bırak (ya da en yenilerden 4'e çevirebilirsin)
    return [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, now]);

  if (loading) {
    return (
      <section className="bg-light1 py-12 text-center">
        Ürünler yükleniyor…
      </section>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="bg-light1 py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-center font-playfair text-3xl md:text-4xl text-black uppercase mb-8">
          Yeni Eklenen Ürünler
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {items.map((p) => {
            const posterUrl =
              p.poster || (Array.isArray(p.images) ? p.images[0] : null);

            const { price, discountedPrice, discountRate } = toCardPricing(p);

            const stock = Array.isArray(p.sizes)
              ? p.sizes.reduce((sum, s) => sum + (s.stock || 0), 0)
              : 0;

            return (
              <NewProductItem
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
