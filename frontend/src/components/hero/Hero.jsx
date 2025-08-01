// src/components/Hero.jsx
import React, { useRef, useState, useEffect, useCallback } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

import hero1 from "../../assets/hero/hero1.mp4";
import hero2 from "../../assets/hero/hero2.mp4";
import hero3 from "../../assets/hero/hero3.mp4";

const slides = [
  { id: 1, video: hero1 },
  { id: 2, video: hero2 },
  { id: 3, video: hero3 },
];

export default function Hero() {
  const swiperRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const onSlideChange = useCallback(() => {
    setActiveIndex(swiperRef.current.swiper.realIndex);
  }, []);

  useEffect(() => {
    const swiper = swiperRef.current.swiper;
    swiper.on("slideChange", onSlideChange);
    setActiveIndex(swiper.realIndex);

    return () => swiper.off("slideChange", onSlideChange);
  }, [onSlideChange]);

  // Aktif video slide'ında autoplay'yi garantiye almak için
  useEffect(() => {
    const videos = document.querySelectorAll("video");
    videos.forEach((video, idx) => {
      if (idx === activeIndex) {
        video.currentTime = 0;
        video.play().catch((e) => console.warn("Video play hatası:", e));
      } else {
        video.pause();
      }
    });
  }, [activeIndex]);

  const handleVideoEnd = () => {
    swiperRef.current.swiper.slideNext();
  };

  return (
    <section className="relative w-full h-screen overflow-hidden">
      <Swiper ref={swiperRef} slidesPerView={1} loop className="h-full">
        {slides.map(({ id, video }, idx) => (
          <SwiperSlide key={id}>
            <div className="relative w-full h-full">
              <video
                src={video}
                className="w-full h-full object-cover"
                autoPlay={activeIndex === idx}
                muted
                playsInline
                preload="auto"
                onEnded={handleVideoEnd}
              />

              <div className="absolute inset-0 bg-black bg-opacity-40" />

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

      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 z-50">
        {slides.map((_, idx) => (
          <div
            key={idx}
            className="relative w-16 h-2 bg-white/50 rounded-full overflow-hidden"
          >
            <div
              className="absolute top-0 left-0 h-full bg-white rounded-full transition-all duration-700 ease-in-out"
              style={{ width: activeIndex === idx ? "100%" : "0%" }}
            />
          </div>
        ))}
      </div>
    </section>
  );
}