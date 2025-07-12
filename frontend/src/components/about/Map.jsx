// src/components/Map.jsx
import React from "react";

const Map = () => {
  const address = "1600 Amphitheatre Parkway, Mountain View, CA";
  const src = `https://maps.google.com/maps?q=${encodeURIComponent(
    address
  )}&t=&z=13&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden shadow-lg">
      <iframe
        title="Google Map"
        src={src}
        className="w-full h-full border-0"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
};

export default Map;
