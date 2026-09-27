import React, { useState, useEffect, useRef } from "react";
import { getResponsiveImageProps } from "../../../utils/media";

// Büyük görsel en fazla 32rem (512px) genişlikte; küçükler 3-4 sütun.
const MAIN_IMAGE = { widths: [320, 640, 960, 1200], defaultWidth: 960, sizes: "(min-width: 640px) 512px, 100vw" };
const THUMB_IMAGE = { widths: [320, 640], defaultWidth: 320, sizes: "(min-width: 640px) 120px, 30vw" };

export default function ProductDetails({ product }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showZoom, setShowZoom] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const zoomAreaRef = useRef(null);

  useEffect(() => {
    setActiveIndex(0);
  }, [product?._id]);

  const handleMouseMove = (e) => {
    if (!zoomAreaRef.current) return;
    const rect = zoomAreaRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  const handleImageClick = () => {
    setShowZoom((prev) => !prev);
  };

  if (!product) return null;

  // Medya kayıtları varsa farklı boyutlar (srcset) kullanılır; yoksa eski tek adres.
  const gallery = product.media?.images?.length ? product.media.images : product.images || [];
  const active = gallery[activeIndex] || gallery[0];
  const mainImage = getResponsiveImageProps(active, MAIN_IMAGE);

  return (
    <section className="max-w-5xl mx-auto px-4 md:px-6 py-10 space-y-10">
      {/* Galeri */}
      <div className="flex flex-col gap-5 items-center">
        {/* Büyük Görsel */}
        <div className="w-full max-w-lg aspect-[3/4] overflow-hidden rounded-xl border border-light2 shadow-sm">
          <div
            ref={zoomAreaRef}
            className="relative w-full h-full"
            onClick={handleImageClick}
            onMouseMove={handleMouseMove}
          >
            <img
              src={mainImage.src}
              srcSet={mainImage.srcSet}
              sizes={mainImage.sizes}
              alt={product.name}
              fetchPriority="high"
              className={`w-full h-full object-cover transition-transform duration-300 ${
                showZoom ? "scale-150" : "scale-100"
              }`}
              style={
                showZoom
                  ? {
                      transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                    }
                  : {}
              }
            />
          </div>
        </div>

        {/* Küçük Görseller */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-w-lg w-full">
          {gallery.map((img, i) => {
            const thumb = getResponsiveImageProps(img, THUMB_IMAGE);
            return (
              <button
                key={i}
                type="button"
                aria-label={`${product.name} görsel ${i + 1}`}
                aria-pressed={activeIndex === i}
                onClick={() => {
                  setActiveIndex(i);
                  setShowZoom(false);
                }}
                className={`aspect-square overflow-hidden rounded border transition ${
                  activeIndex === i
                    ? "border-dark1"
                    : "border-light2 hover:border-dark2"
                }`}
              >
                <img
                  src={thumb.src}
                  srcSet={thumb.srcSet}
                  sizes={thumb.sizes}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              </button>
            );
          })}
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
