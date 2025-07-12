// src/components/SocialMedia.jsx
import React from "react";

const images = [
  "/src/assets/social-media/post1.png",
  "/src/assets/social-media/post2.png",
  "/src/assets/social-media/post3.png",
  "/src/assets/social-media/post4.png",
  "/src/assets/social-media/post5.png",
  "/src/assets/social-media/post6.png",
];

const SocialMedia = () => (
  <div className="bg-[#f9f8fd] p-8">
    <h4 className="text-2xl font-semibold text-gray-800 mb-4 border-b border-purple-100 pb-2">
      Instagram Feeds
    </h4>

    <div className="grid grid-cols-3 gap-4">
      {images.map((src, i) => (
        <img
          key={i}
          src={src}
          alt={`instagram-${i}`}
          className="w-full h-full object-cover"
        />
      ))}
    </div>
  </div>
);

export default SocialMedia;
