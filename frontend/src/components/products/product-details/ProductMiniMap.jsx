// src/components/ProductMiniMap.jsx
import React from "react";

const ProductMiniMap = () => {
  const address = "New York, NY";
  const src = `https://maps.google.com/maps?q=${encodeURIComponent(
    address
  )}&t=&z=12&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className="w-full h-40 rounded-lg overflow-hidden shadow mb-8">
      <iframe
        title="Product Location"
        src={src}
        className="w-full h-full border-0"
        loading="lazy"
      />
    </div>
  );
};

export default ProductMiniMap;
