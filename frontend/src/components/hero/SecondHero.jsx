// src/components/SecondHero.jsx
import React from "react";
import secondHeroImg from "../../assets/second-hero/second-hero.png";

const SecondHero = () => (
  <section className="relative w-full">
    {/* Arka plan resmi */}
    <div className="w-full h-[60vh] md:h-[70vh] lg:h-[80vh] overflow-hidden">
      <img
        src={secondHeroImg}
        alt="Collection Houses"
        className="w-full h-full object-cover"
      />
    </div>

    {/* Koyu overlay */}
    <div className="absolute inset-0 bg-dark1/70" />

    {/* İçerik */}
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
      <h2 className="text-3xl md:text-5xl lg:text-6xl font-playfair font-bold text-white uppercase leading-tight">
        Collection Houses
      </h2>
      <p className="mt-3 text-lg md:text-2xl text-light2 tracking-wide">
        Our First-Ever
      </p>
      <button className="mt-6 px-8 py-3 bg-dark3 hover:bg-dark2 text-white font-medium rounded-full transition duration-300">
        About Us
      </button>
    </div>
  </section>
);

export default SecondHero;
