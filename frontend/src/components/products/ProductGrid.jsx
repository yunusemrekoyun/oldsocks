// src/components/ProductGrid.jsx
import React from "react";
import ProductGridItem from "./ProductGridItem";

const products = Array.from({ length: 8 }).map((_, i) => ({
  id: i + 1,
  video: `/src/assets/products/${i + 1}.mp4`,
  name: `Knitted Jumper ${i + 1}`,
  price: 30,
  rating: 5,
}));

const ProductGrid = () => (
  <section className="container mx-auto px-4 py-12">
    <h2 className="text-center font-serif text-3xl md:text-4xl text-purple-900 uppercase mb-8">
      New Arrival
    </h2>

    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
      {products.map((p) => (
        <ProductGridItem key={p.id} {...p} />
      ))}
    </div>

    <div className="mt-10 text-center">
      <button className="px-6 py-2 border border-purple-600 text-purple-600 rounded-full hover:bg-purple-600 hover:text-white transition">
        Browse More
      </button>
    </div>
  </section>
);

export default ProductGrid;
