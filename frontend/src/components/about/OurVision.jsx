// src/components/OurVision.jsx
import React from "react";
import storyImg from "../../assets/about/vision.png"; // kendi “Our Story” görselini koy

const OurVision = () => (
  <section className="container mx-auto px-4 py-16">
    <h2 className="text-center text-4xl font-serif font-bold text-purple-900 mb-4">
      Our Story
    </h2>
    <p className="text-center text-gray-600 max-w-3xl mx-auto mb-8">
      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
      tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
      veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
      commodo consequat. Duis aute irure dolor in reprehenderit in voluptate
      velit esse cillum dolore eu fugiat nulla pariatur.
    </p>
    <div className="overflow-hidden rounded-lg shadow-lg">
      <img
        src={storyImg}
        alt="Our Story"
        className="w-full h-auto object-cover"
      />
    </div>
  </section>
);

export default OurVision;
