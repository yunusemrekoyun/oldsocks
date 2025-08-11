// src/components/home/Hero.jsx
import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import hero1 from "../../assets/hero/hero1.mp4";

export default function Hero() {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onVisibility = () => {
      if (document.hidden) {
        video.pause();
      } else {
        const prefersReduced =
          window.matchMedia &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (!prefersReduced) {
          video.play().catch(() => {});
        }
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    video.play().catch(() => {});

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <section className="relative w-full min-h-[60vh] md:min-h-[80vh] lg:min-h-screen overflow-hidden">
      {/* Video */}
      <video
        ref={videoRef}
        src={hero1}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Buton en alt ortada */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <Link
          to="/shop"
          className="px-7 md:px-8 py-3 md:py-3.5 bg-dark1 hover:bg-dark2 text-light1 font-medium rounded-full transition"
        >
          Shop Now
        </Link>
      </div>
    </section>
  );
}
