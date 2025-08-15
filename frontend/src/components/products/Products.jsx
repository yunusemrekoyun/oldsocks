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

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 mt-8">
      {products.map((p) => {
        const rate = Number(p.discount || 0);
        const hasDiscount = rate > 0 && p.price != null;
        const discountedPrice = hasDiscount
          ? Math.max(0, Number(((p.price * (100 - rate)) / 100).toFixed(2)))
          : null;

        return (
          <ProductItem
            key={p._id}
            id={p._id}
            video={p.video}
            poster={p.poster || p.images?.[0] || null}
            name={p.name}
            price={Number(p.price || 0)}
            discountedPrice={discountedPrice}
            discountRate={hasDiscount ? rate : 0}
            // stok bilgisi gerekiyorsa:
            stock={
              Array.isArray(p.sizes)
                ? p.sizes.reduce((sum, s) => sum + (s.stock || 0), 0)
                : 0
            }
          />
        );
      })}
    </div>
  );
}
