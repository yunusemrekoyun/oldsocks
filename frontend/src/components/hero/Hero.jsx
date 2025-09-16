import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../../api";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

export default function Hero() {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    api.get("/hero-videos")
      .then((res) => setVideos(res.data))
      .catch((err) => console.error("Video alınamadı:", err));
  }, []);

  if (videos.length === 0) return null;

  // Tek video varsa
  if (videos.length === 1) {
    return (
      <section className="relative w-full h-screen overflow-hidden">
        <video
          src={videos[0].url}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        />

        {/* Buton */}
        <Link
          to="/shop"
          className="absolute bottom-16 left-1/2 -translate-x-1/2 px-6 py-3 text-white border border-white rounded-full bg-black/30 backdrop-blur-sm hover:bg-white hover:text-black transition z-20"
        >
          Alışverişe Başla
        </Link>
      </section>
    );
  }

  // 2+ video varsa slider
  return (
    <section className="relative w-full h-screen overflow-hidden">
      <Swiper
        modules={[Autoplay, Pagination]}
        loop={true}
        autoplay={{ delay: 5000 }}
        pagination={{ clickable: true }}
        className="w-full h-full"
      >
        {videos.map((vid) => (
          <SwiperSlide key={vid._id}>
            <video
              src={vid.url}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Buton */}
      <Link
        to="/shop"
        className="absolute bottom-16 left-1/2 -translate-x-1/2 px-6 py-3 text-white border border-white rounded-full bg-black/30 backdrop-blur-sm hover:bg-white hover:text-black transition z-20"
      >
        Alışverişe Başla
      </Link>

      {/* Pagination stilleri */}
      <style jsx="true">{`
        .swiper-pagination {
          position: absolute;
          bottom: 20px;
          left: 0;
          right: 0;
          display: flex;
          justify-content: center;
          gap: 10px;
          z-index: 20;
        }

        .swiper-pagination-bullet {
          width: 12px;
          height: 12px;
          background: rgba(255, 255, 255, 0.4);
          border-radius: 9999px;
          opacity: 1;
          transition: background 0.3s ease;
        }

        .swiper-pagination-bullet-active {
          background: white;
          box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.4);
        }
      `}</style>
    </section>
  );
}