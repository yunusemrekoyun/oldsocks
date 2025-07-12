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
  <div className="bg-[#f4f4f4] p-6 rounded-lg shadow-sm">
    <h4 className="text-xl font-semibold text-[#0b0b0d] mb-4 border-b border-[#d9d9d9] pb-2">
      Instagram Feeds
    </h4>

    <div className="grid grid-cols-3 gap-3">
      {images.map((src, i) => (
        <img
          key={i}
          src={src}
          alt={`instagram-${i}`}
          className="w-full aspect-square object-cover rounded-md hover:opacity-80 transition"
        />
      ))}
    </div>
  </div>
);

export default SocialMedia;
