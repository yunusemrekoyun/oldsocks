import React, { useState, useEffect } from "react";
import api from "../../../../api";
import SimilarProductsItem from "./SimilarProductsItem";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";

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
        const isInStock = (product) => {
          const totalStock = Array.isArray(product.sizes)
            ? product.sizes.reduce((sum, s) => sum + (s.stock || 0), 0)
            : 0;
          return totalStock > 0;
        };

        const filtered = data.filter(
          (p) => p._id !== currentProductId && isInStock(p)
        );

        const sameSub = filtered.filter((p) => {
          const cid = p.category?._id || p.category;
          return cid === categoryId;
        });

        const sameParent = filtered.filter((p) => {
          const pid = p.category?.parent?._id || p.category?.parent;
          return pid === categoryId;
        });

        let result = [];

        if (sameSub.length > 0) {
          result = sameSub;
        } else if (sameParent.length > 0) {
          result = sameParent;
        } else {
          result = filtered;
        }

        // Basit shuffle
        for (let i = result.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [result[i], result[j]] = [result[j], result[i]];
        }

        setItems(result.slice(0, 5));
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
    return (
      <div className="text-center py-4">Stokta benzer ürün bulunamadı.</div>
    );

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Benzer Ürünler</h3>
      <Swiper
        modules={[Autoplay, FreeMode]}
        spaceBetween={16}
        slidesPerView={2}
        autoplay={{ delay: 3000 }}
        loop={true}
        grabCursor={true}
        freeMode={true}
        className="!px-2"
      >
        {items.map((p) => (
          <SwiperSlide key={p._id}>
            <SimilarProductsItem
              id={p._id}
              video={p.video}
              name={p.name}
              price={p.price}
              discountedPrice={p.discountedPrice} // ✅ Artık doğru geçiyor
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
