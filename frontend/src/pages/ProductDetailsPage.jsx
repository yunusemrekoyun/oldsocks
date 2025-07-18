// src/pages/ProductDetailsPage.jsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../../api";

import BreadCrumb from "../components/breadCrumb/BreadCrumb";
import ProductDetails from "../components/products/product-details/ProductDetails";
import SimilarProducts from "../components/products/product-details/SimilarProducts";
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

  if (loading) return <div className="text-center py-10">Ürün yükleniyor…</div>;
  if (error)
    return <div className="text-center py-10 text-red-600">{error}</div>;
  if (!product)
    return <div className="text-center py-10">Ürün bulunamadı.</div>;

  // product.category bazen nesne, bazen string olabileceği için güvenli alalım
  const cat = product.category;
  const categoryId = cat?._id ?? (typeof cat === "string" ? cat : null);
  // Eğer kategori bir alt kategori ise onu atlayıp parent’ı al, yoksa kendisi
  const rootCategoryId =
    cat && typeof cat === "object" && cat.parent ? cat.parent._id : categoryId;

  return (
    <>
      <BreadCrumb category={product.category} name={product.name} />

      <main className="container mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Detaylar */}
        <section className="lg:col-span-2">
          <ProductDetails product={product} />
        </section>

        {/* Sağ sidebar */}
        <aside className="lg:col-span-1 space-y-6">
          <SimilarProducts
            categoryId={rootCategoryId}
            currentProductId={product._id}
          />
          <AddToCart price={product.price} sizes={product.sizes} />
        </aside>
      </main>

      <Campaigns />
      <Services />
    </>
  );
}
