import React from "react";
import storyImg from "../../assets/about/vision.png";

const OurVision = () => (
  <section className="bg-light1 py-20 px-4">
    <div className="container mx-auto">
      <h2 className="text-4xl font-serif font-bold text-dark1 text-center mb-6">
        Our Story
      </h2>
      <p className="text-center text-dark2 max-w-2xl mx-auto mb-10 leading-relaxed">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua.
      </p>
      <div className="overflow-hidden rounded-xl shadow-lg">
        <img
          src={storyImg}
          alt="Our Story"
          className="w-full h-auto object-cover"
        />
      </div>
    </div>
  </section>
);

export default OurVision;
