// src/components/products/Products.jsx
import React from "react";
import ProductItem from "./ProductItem";

const sampleProducts = Array.from({ length: 8 }).map((_, i) => ({
  id: i + 1,
  video: `/src/assets/products/${i + 1}.mp4`,
  name: `Knitted Jumper ${i + 1}`,
  price: 30,
  rating: 5,
}));

const Products = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 mt-8">
    {sampleProducts.map((prod) => (
      <ProductItem key={prod.id} {...prod} />
    ))}
  </div>
);

export default Products;
