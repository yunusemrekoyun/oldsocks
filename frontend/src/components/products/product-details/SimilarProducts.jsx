// src/components/SimilarProducts.jsx
import React, { useState, useEffect } from "react";
import api from "../../../../api";
import SimilarProductsItem from "../product-details/SimilarProductsItem";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

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
        const sameCat = data.filter((p) => {
          if (!p.category) return false;
          const cid = p.category._id || p.category;
          const pid = p.category.parent?._id ?? p.category.parent;
          return cid === categoryId || pid === categoryId;
        });
        const filtered = sameCat.filter((p) => p._id !== currentProductId);
        for (let i = filtered.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
        }
        setItems(filtered.slice(0, 5)); // 5'e çıkardım slidera uygun olsun
        setError("");
      })
      .catch(() => setError("Benzer ürünler yüklenemedi."))
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
      <Swiper
        modules={[Navigation, Autoplay]}
        spaceBetween={16}
        slidesPerView={2}
        navigation
        autoplay={{ delay: 3000 }}
        loop={true}
        grabCursor={true}
        className="!px-2"
      >
        {items.map((p) => (
          <SwiperSlide key={p._id}>
            <SimilarProductsItem
              id={p._id}
              video={p.video}
              name={p.name}
              price={p.price}
              rating={5}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
