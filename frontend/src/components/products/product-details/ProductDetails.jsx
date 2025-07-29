// src/components/products/product-details/ProductDetails.jsx
import React, { useState, useEffect, useRef } from "react";
export default function ProductDetails({ product }) {
  if (!product) return null;

  const [activeImg, setActiveImg] = useState("");
  const [showZoom, setShowZoom] = useState(false);
  const zoomTimer = useRef(null);

  const handleMouseEnter = () => {
    zoomTimer.current = setTimeout(() => {
      setShowZoom(true);
    }, 2000);
  };

  const handleMouseLeave = () => {
    clearTimeout(zoomTimer.current);
    setShowZoom(false);
  };

  useEffect(() => {
    if (product.images?.length) {
      setActiveImg(product.images[0]);
    }
  }, [product.images]);

  return (
  <section className="max-w-5xl mx-auto px-4 md:px-6 py-10 space-y-10">
    {/* Galeri */}
    <div className="flex flex-col gap-5 items-center">
      {/* Büyük Görsel */}
      <div className="w-full max-w-lg aspect-[3/4] overflow-hidden rounded-xl border border-light2 shadow-sm">
        <div
          className="relative w-full h-full"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <img
            src={activeImg || product.images[0]}
            alt="Seçilen görsel"
            className={`w-full h-full object-cover transition-transform duration-300 ${
              showZoom ? "scale-125" : "scale-100"
            }`}
          />
        </div>
      </div>

      {/* Küçük Görseller */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-w-lg w-full">
        {product.images.map((img, i) => (
          <button
            key={i}
            onClick={() => setActiveImg(img)}
            className={`aspect-square overflow-hidden rounded border transition ${
              activeImg === img
                ? "border-dark1"
                : "border-light2 hover:border-dark2"
            }`}
          >
            <img
              src={img}
              alt={`thumbnail-${i}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>

    {/* Açıklama */}
    <div className="bg-light1 border border-light2 rounded-xl p-6 shadow text-dark2 leading-relaxed text-sm">
      <h2 className="text-lg text-dark1 font-bold mb-3">Açıklama</h2>
      {product.description ? (
        <p>{product.description}</p>
      ) : (
        <p className="italic text-gray-500">Açıklama bulunamadı.</p>
      )}
    </div>
  </section>
);
}
