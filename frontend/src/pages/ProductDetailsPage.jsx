// src/pages/ProductDetailsPage.jsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../../api";

import BreadCrumb from "../components/breadCrumb/BreadCrumb";
import ProductDetails from "../components/products/product-details/ProductDetails";
import SimilarProducts from "../components/products/product-details/SimilarProducts";
import AddToCart from "../components/products/product-details/AddToCart";
import ProductInfoSections from "../components/products/product-details/ProductInfoSections";
import Campaigns from "../components/campaigns/Campaigns";
import Services from "../components/services/Services";
import { useStorefrontSettings } from "../context/storefrontSettings";
import PageLoading from "../components/common/PageLoading";
import usePageMeta from "../hooks/usePageMeta";
import { formatTry } from "../utils/currency";

export default function ProductDetailsPage() {
  const { similarProductsVisible } = useStorefrontSettings();
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

  const firstImage = product?.media?.images?.[0]?.url || product?.images?.[0] || undefined;
  usePageMeta({
    title: product?.name || (error ? "Ürün bulunamadı" : "Ürün"),
    description: product
      ? product.description || `${product.name} — ${formatTry(product.price)}. OLDSOCKS mağazasında.`
      : undefined,
    image: firstImage,
    type: product ? "product" : "website",
    noindex: Boolean(error),
  });

  // Google'da fiyat ve stok gösterilebilsin diye yapılandırılmış veri (schema.org).
  useEffect(() => {
    if (!product) return undefined;
    const url = `${window.location.origin}/product-details/${product._id}`;
    const cat = product.category && typeof product.category === "object" ? product.category : null;
    const inStock = (product.sizes || []).some((s) => Number(s?.stock) > 0);
    const crumbs = [
      { name: "Ana Sayfa", item: `${window.location.origin}/` },
      { name: "Mağaza", item: `${window.location.origin}/shop` },
      ...(cat?._id ? [{ name: cat.name, item: `${window.location.origin}/shop?kategori=${cat._id}` }] : []),
      { name: product.name, item: url },
    ];
    const data = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Product",
          name: product.name,
          ...(firstImage ? { image: [firstImage] } : {}),
          ...(product.description ? { description: product.description } : {}),
          sku: String(product._id),
          ...(product.color ? { color: product.color } : {}),
          brand: { "@type": "Brand", name: "OLDSOCKS" },
          offers: {
            "@type": "Offer",
            url,
            priceCurrency: "TRY",
            price: Number(product.price || 0).toFixed(2),
            availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            itemCondition: "https://schema.org/NewCondition",
          },
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: c.item })),
        },
      ],
    };
    const el = document.createElement("script");
    el.type = "application/ld+json";
    el.textContent = JSON.stringify(data);
    document.head.appendChild(el);
    return () => el.remove();
  }, [product, firstImage]);

  if (loading) return <PageLoading text="Ürün yükleniyor…" />;
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

      <div className="mx-auto max-w-7xl px-4 pb-12 pt-2 sm:px-6 lg:px-8 lg:pt-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-12">
          {/* Görseller */}
          <section className="lg:col-span-7" aria-label="Ürün görselleri">
            <ProductDetails product={product} />
          </section>

          {/* Satın alma: kaydırırken masaüstünde sabit kalır */}
          <aside className="lg:col-span-5">
            <div className="space-y-6 lg:sticky lg:top-24">
              <AddToCart
                price={product.price}
                sizes={product.sizes}
                color={product.color}
                parentProductId={product.parentProductId}
                productId={product._id}
                productName={product.name}
                image={product.images?.[0]}
              />
              <ProductInfoSections description={product.description} />
            </div>
          </aside>
        </div>

        {similarProductsVisible !== false && (
          <section className="mt-14 lg:mt-20">
            <SimilarProducts categoryId={rootCategoryId} currentProductId={product._id} />
          </section>
        )}
      </div>

      <Campaigns />
      <Services />
    </>
  );
}
