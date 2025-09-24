import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../../api";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

/** Ortak yükseklik limiti: videoHeight || naturalHeight üzerinden hesaplar */
function useHeroHeightLimit(elRef) {
  const [pxHeight, setPxHeight] = useState(null);

  useEffect(() => {
    if (!elRef?.current) return;
    const el = elRef.current;

    function getNaturalHeight(node) {
      // video ise videoHeight, image ise naturalHeight
      return node.videoHeight || node.naturalHeight || 0;
    }

    function compute() {
      const dpr = window.devicePixelRatio || 1;
      const needPx = Math.round(window.innerHeight * dpr);
      const natural = getNaturalHeight(el);

      if (natural > 0 && natural < needPx) {
        const cssPx = Math.round(natural / dpr);
        setPxHeight(cssPx);
      } else {
        setPxHeight(null); // 100vh
      }
    }

    const onMetaOrLoad = () => compute();

    // video -> loadedmetadata, image -> load
    el.addEventListener("loadedmetadata", onMetaOrLoad);
    el.addEventListener("load", onMetaOrLoad);
    window.addEventListener("resize", compute);

    // İlk deneme (bazı tarayıcılarda event gecikebilir)
    setTimeout(compute, 0);

    return () => {
      el.removeEventListener("loadedmetadata", onMetaOrLoad);
      el.removeEventListener("load", onMetaOrLoad);
      window.removeEventListener("resize", compute);
    };
  }, [elRef]);

  return pxHeight;
}

export default function Hero() {
  const [items, setItems] = useState([]);
  const singleRef = useRef(null);
  const singleHeightPx = useHeroHeightLimit(singleRef);

  useEffect(() => {
    api
      .get("/hero-videos")
      .then((res) => setItems(res.data || []))
      .catch((err) => console.error("Hero media alınamadı:", err));
  }, []);

  if (!items.length) return null;

  const renderMedia = (item, refIfSingle = null) => {
    if (item.kind === "image") {
      return (
        <img
          ref={refIfSingle || null}
          src={item.url}
          alt="Hero"
          className="w-full h-full object-cover object-center block"
          // poster ihtiyacı yok; img için yok.
        />
      );
    }
    return (
      <video
        ref={refIfSingle || null}
        src={item.url}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="w-full h-full object-cover object-center block"
      />
    );
  };

  // Tek medya
  if (items.length === 1) {
    const style =
      singleHeightPx != null
        ? { height: `${singleHeightPx}px` }
        : { height: "100vh" };

    return (
      <section className="relative w-full overflow-hidden" style={style}>
        {renderMedia(items[0], singleRef)}

        {/* CTA */}
        <Link
          to="/shop"
          className="absolute bottom-16 left-1/2 -translate-x-1/2 px-6 py-3 text-white border border-white rounded-full bg-black/30 backdrop-blur-sm hover:bg-white hover:text-black transition z-20"
        >
          Alışverişe Başla
        </Link>
      </section>
    );
  }

  // 2+ medya -> slider
  return (
    <section className="relative w-full h-[100vh] overflow-hidden">
      <Swiper
        modules={[Autoplay, Pagination]}
        loop={true}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        className="w-full h-full"
      >
        {items.map((it) => (
          <SwiperSlide key={it._id} className="!flex">
            {renderMedia(it)}
          </SwiperSlide>
        ))}
      </Swiper>

      {/* CTA */}
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
