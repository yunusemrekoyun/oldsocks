// src/components/Hero.jsx
import React, { useRef, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

import hero1 from "../../assets/hero/hero1.mp4";
import hero2 from "../../assets/hero/hero2.mp4";
import hero3 from "../../assets/hero/hero3.mp4";

const slides = [
  { id: 1, video: hero1 },
  { id: 2, video: hero2 },
  { id: 3, video: hero3 },
];

const Hero = () => {
  const swiperRef = useRef(null);

  const handleVideoEnd = () => {
    if (swiperRef.current && swiperRef.current.swiper) {
      swiperRef.current.swiper.slideNext();
    }
  };

  useEffect(() => {
    // Autoplay'i Swiper üzerinden kapattık çünkü artık video yönetiyor.
  }, []);

  return (
    <section className="relative w-full">
      <Swiper
        ref={swiperRef}
        modules={[Pagination]}
        slidesPerView={1}
        loop
        pagination={{ clickable: true }}
        className="h-screen"
      >
        {slides.map(({ id, video }) => (
          <SwiperSlide key={id}>
            <div className="relative w-full h-screen">
              {/* Video */}
              <video
                src={video}
                className="w-full h-full object-cover"
                autoPlay
                muted
                playsInline
                onEnded={handleVideoEnd}
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-30" />

              {/* İçerik */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white uppercase leading-tight">
                  Fashion <br /> Changing <br /> Always
                </h1>
                <button className="mt-8 px-8 py-3 bg-dark1 hover:bg-dark2 text-light1 font-medium rounded-full transition">
                  Shop Now
                </button>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};

export default Hero;
