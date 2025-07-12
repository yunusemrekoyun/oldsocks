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
  <section className="bg-light1 py-12">
    <div className="container mx-auto px-4">
      <h2 className="text-center font-playfair text-3xl md:text-4xl text-black uppercase mb-8">
        New Arrival
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        {products.map((p) => (
          <ProductGridItem key={p.id} {...p} />
        ))}
      </div>

      <div className="mt-10 text-center">
        <button className="px-6 py-2 border border-black text-black rounded-full hover:bg-black hover:text-white transition">
          Browse More
        </button>
      </div>
    </div>
  </section>
);

export default ProductGrid;
