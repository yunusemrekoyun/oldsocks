// src/components/products/product-details/ProductDetails.jsx
import React from "react";

export default function ProductDetails({ product }) {
  if (!product) return null;

  return (
    <section className="space-y-8">
      {/* Açıklama */}
      <div>
        <h2 className="text-2xl font-semibold text-dark1 mb-4">Description</h2>
        <p className="text-dark2">
          {product.description || "Açıklama bulunamadı."}
        </p>
      </div>

      {/* Galeri */}
      {product.images && product.images.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold text-dark1 mb-4">Gallery</h2>
          <div className="grid grid-cols-2 gap-6">
            {product.images.map((img, idx) => (
              <div
                key={idx}
                className="rounded-lg overflow-hidden shadow-md bg-light1 border border-light2"
              >
                <img
                  src={img}
                  alt={`${product.name} Galeri ${idx + 1}`}
                  className="w-full h-80 md:h-[28rem] object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
