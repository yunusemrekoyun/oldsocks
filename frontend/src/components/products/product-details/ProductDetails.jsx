// src/components/ProductDetails.jsx
import React from "react";
import p2 from "../../../assets/products/p1.png";
import p3 from "../../../assets/products/p2.png";
import p5 from "../../../assets/products/p3.png";
import p6 from "../../../assets/products/p4.png";
const ProductDetails = () => (
  <section className="space-y-8">
    {/* Üst açıklama */}
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">Description</h2>
      <p className="text-gray-600">
        There are many variations of passages of Lorem Ipsum available, but the
        majority have suffered alteration in some form, by injected humour, or
        randomised words which don’t look even slightly believable. If you are
        going to use a passage of Lorem Ipsum, you need to be sure there isn’t
        anything embarrassing hidden in the middle of text.
      </p>
    </div>

    {/* Galeri (dikey kutucuklar) */}
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">Gallery</h2>
      <div className="grid grid-cols-2 gap-6">
        {[p2, p3, p5, p6].map((img, idx) => (
          <div key={idx} className="rounded-lg overflow-hidden shadow-lg">
            <img
              src={img}
              alt={`Detail ${idx + 1}`}
              className="w-full h-80 md:h-[28rem] object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default ProductDetails;
