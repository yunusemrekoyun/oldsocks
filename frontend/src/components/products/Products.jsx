// src/components/products/Products.jsx
import React, { useState, useEffect } from "react";
import ProductItem from "./ProductItem";
import api from "../../../api";

export default function Products({ products: propProducts }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (Array.isArray(propProducts)) {
      setProducts(propProducts);
      setLoading(false);
    } else {
      fetchProducts();
    }
  }, [propProducts]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/products");
      setProducts(data);
    } catch (err) {
      console.error("Ürünler alınamadı:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return <div className="text-center py-10">Ürünler yükleniyor…</div>;

  if (products.length === 0) {
    return <div className="text-center py-10">Ürün bulunamadı.</div>;
  }

  // ── Yardımcı: Kart için doğru fiyat alanlarını normalize et ──────────────
  const toCardPricing = (p) => {
    const final = Number(p.price ?? 0); // backend'in final fiyatı
    const original = Number(p.originalPrice ?? 0); // orijinal fiyat

    const hasDiscount = original > 0 && final > 0 && final < original;
    const computedRate = hasDiscount
      ? Math.round(100 - (final / original) * 100)
      : 0;

    return {
      // ProductItem props:
      price: hasDiscount ? original : final, // baş fiyat olarak orijinal (yoksa final)
      discountedPrice: hasDiscount ? final : null, // varsa final fiyatı gönder
      discountRate: hasDiscount ? computedRate : 0, // rozet için yüzde
    };
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 mt-8">
      {products.map((p) => {
        const { price, discountedPrice, discountRate } = toCardPricing(p);

        const stock = Array.isArray(p.sizes)
          ? p.sizes.reduce((sum, s) => sum + (s.stock || 0), 0)
          : 0;

        return (
          <ProductItem
            key={p._id}
            id={p._id}
            video={p.video}
            poster={p.poster || p.images?.[0] || null}
            name={p.name}
            price={price} // ← orijinal (yoksa final)
            discountedPrice={discountedPrice} // ← final
            discountRate={discountRate} // ← hesaplanan yüzde
            stock={stock}
          />
        );
      })}
    </div>
  );
}
