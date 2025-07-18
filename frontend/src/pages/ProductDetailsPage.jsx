// src/pages/ProductDetailsPage.jsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../../api";

import BreadCrumb from "../components/breadCrumb/BreadCrumb";
import ProductDetails from "../components/products/product-details/ProductDetails";
import ProductMiniMap from "../components/products/product-details/ProductMiniMap";
import AddToCart from "../components/products/product-details/AddToCart";
import Campaigns from "../components/campaigns/Campaigns";
import Services from "../components/services/Services";

export default function ProductDetailsPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    api
      .get(`/products/${id}`)
      .then(({ data }) => {
        setProduct(data);
        setError("");
      })
      .catch(() => {
        setError("Ürün yüklenirken hata oluştu.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="text-center py-10">Ürün yükleniyor…</div>;
  }
  if (error) {
    return <div className="text-center py-10 text-red-600">{error}</div>;
  }
  if (!product) {
    return <div className="text-center py-10">Ürün bulunamadı.</div>;
  }

  return (
    <>
      {/* Eğer BreadCrumb kategori ve isim isterse onlara da prop ver */}
      <BreadCrumb category={product.category} name={product.name} />

      <main className="container mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Üst açıklama ve galeri */}
        <section className="lg:col-span-2">
          <ProductDetails product={product} />
        </section>

        {/* Fiyat, beden seçimi, sepete ekle */}
        <aside className="lg:col-span-1 space-y-6">
          <ProductMiniMap images={product.images} />
          <AddToCart price={product.price} sizes={product.sizes} />
        </aside>
      </main>

      <Campaigns />
      <Services />
    </>
  );
}
