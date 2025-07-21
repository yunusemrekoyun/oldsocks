// src/components/products/Products.jsx
import React, { useState, useEffect } from "react";
import ProductItem from "./ProductItem";
import api from "../../../api";

export default function Products({ products: propProducts }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (Array.isArray(propProducts)) {
      // parent prop'u geldiğinde onu kullan
      setProducts(propProducts);
      setLoading(false);
    } else {
      // prop yoksa eskiden olduğu gibi fetch et
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

  if (loading) {
    return <div className="text-center py-10">Ürünler yükleniyor…</div>;
  }

  // Eğer filtrelenmiş listede hiç ürün yoksa farklı bir mesaj gösterebiliriz
  if (Array.isArray(propProducts) && products.length === 0) {
    return (
      <div className="text-center py-10">Filtreye uygun ürün bulunamadı.</div>
    );
  }

  // Eski haliyle, eğer fetch sonrası hiç ürün yoksa:
  if (!Array.isArray(propProducts) && products.length === 0) {
    return <div className="text-center py-10">Ürün bulunamadı.</div>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 mt-8">
      {products.map((p) => (
        <ProductItem
          key={p._id}
          id={p._id}
          video={p.video}
          name={p.name}
          price={p.price}
          rating={5}
        />
      ))}
    </div>
  );
}
