// src/components/Hero.jsx
import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import { Autoplay } from "swiper/modules"; // ✔️ Doğru olan bu!
import "swiper/css";
import "swiper/css/pagination";
import hero1 from "../../assets/hero/hero1.png";
import hero2 from "../../assets/hero/hero2.png";
import hero3 from "../../assets/hero/hero3.png";

const slides = [
  { id: 1, image: hero1 },
  { id: 2, image: hero2 },
  { id: 3, image: hero3 },
];

const Hero = () => (
  <section className="relative w-full">
    <Swiper
      modules={[Autoplay, Pagination]}
      slidesPerView={1}
      loop
      autoplay={{ delay: 5000 }}
      pagination={{ clickable: true }}
      className="h-screen"
    >
      {slides.map(({ id, image }) => (
        <SwiperSlide key={id}>
          <div className="relative w-full h-screen">
            {/* Arka plan resmi */}
            <img
              src={image}
              alt={`Slide ${id}`}
              className="w-full h-full object-cover"
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-30" />

            {/* İçerik */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white uppercase leading-tight">
                Fashion <br /> Changing <br /> Always
              </h1>
              <button className="mt-8 px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-full transition">
                Shop Now
              </button>
            </div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  </section>
);

export default Hero;
