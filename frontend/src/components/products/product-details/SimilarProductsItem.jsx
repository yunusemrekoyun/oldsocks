// src/components/products/SimilarProductItem.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { FaVolumeMute, FaVolumeUp, FaPlay } from "react-icons/fa";

const MOBILE_VIDEO_EVENT = "product-mobile-play";

export default function SimilarProductItem({
  id,
  video,
  poster,
  name,
  price,
  discountedPrice,
}) {
  const videoRef = useRef(null);

  // Cihaz yetenekleri
  const [isHoverCapable, setIsHoverCapable] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  // Desktop: hover; Mobil: kullanıcı “oynat”a bastı mı?
  const [isHovered, setIsHovered] = useState(false);
  const [mobileWantsPlay, setMobileWantsPlay] = useState(false);

  // Ses (yalnız desktop’ta ikon)
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hoverQuery =
        window.matchMedia &&
        window.matchMedia("(hover: hover)").matches === true;
      const touchCapable =
        "ontouchstart" in window ||
        (typeof navigator !== "undefined" &&
          Number(navigator.maxTouchPoints) > 0);

      setIsHoverCapable(hoverQuery);
      setIsTouch(touchCapable);
    }
  }, []);

  const hasDiscount =
    typeof discountedPrice === "number" && discountedPrice < price;

  const pct = useMemo(() => {
    if (!hasDiscount) return 0;
    const val = Math.round(100 - (discountedPrice / price) * 100);
    return Math.max(1, val);
  }, [hasDiscount, discountedPrice, price]);

  /* ---------- Desktop (hover) ---------- */
  const onEnter = () => {
    if (!isHoverCapable) return;
    setIsHovered(true);
    if (videoRef.current && video) {
      videoRef.current
        .play()
        .catch((e) => console.debug("Video play blocked (hover):", e?.message));
    }
  };

  const onLeave = () => {
    if (!isHoverCapable) return;
    setIsHovered(false);
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      } catch (e) {
        console.debug("Video reset error:", e?.message);
      }
    }
  };

  /* ---------- Mobil: “oynat” ---------- */
  const handleMobilePlay = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Diğer kartlara “dur” sinyali
    window.dispatchEvent(new CustomEvent(MOBILE_VIDEO_EVENT, { detail: id }));

    setMobileWantsPlay(true);

    requestAnimationFrame(() => {
      if (videoRef.current) {
        videoRef.current
          .play()
          .catch((err) => console.debug("Mobile play blocked:", err?.message));
      }
    });
  };

  // Başka kart oynarsa bunu durdur
  useEffect(() => {
    const handler = (ev) => {
      if (ev.detail !== id && videoRef.current) {
        try {
          videoRef.current.pause();
          videoRef.current.currentTime = 0;
        } catch (err) {
          console.debug("Pause/reset on external event failed:", err?.message);
        }
        setMobileWantsPlay(false);
      }
    };
    window.addEventListener(MOBILE_VIDEO_EVENT, handler);
    return () => window.removeEventListener(MOBILE_VIDEO_EVENT, handler);
  }, [id]);

  // Unmount’ta durdur
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        try {
          // eslint-disable-next-line react-hooks/exhaustive-deps
          videoRef.current.pause();
        } catch (e) {
          console.debug("Pause on unmount failed:", e?.message);
        }
      }
    };
  }, []);

  /* ---------- Ses toggle (sadece desktop) ---------- */
  const toggleMute = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  };

  // Ne gösterelim?
  // Desktop: video elemanı (hover’da oynar)
  // Mobil: poster, “oynat”a basılırsa video
  const shouldShowVideo =
    !!video && (isHoverCapable || (isTouch && mobileWantsPlay));

  return (
    <Link
      to={`/product-details/${id}`}
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
      className="group relative rounded-2xl overflow-hidden bg-white shadow-md hover:shadow-xl border border-light2 transition-all duration-300 flex flex-col h-full select-none"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {/* Görsel/Video Alanı */}
      <div className="relative h-64 overflow-hidden bg-light1">
        {shouldShowVideo ? (
          <video
            ref={videoRef}
            src={video || undefined}
            poster={poster || undefined}
            muted
            playsInline
            preload={isHoverCapable ? "metadata" : "none"}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            onLoadedMetadata={() => {
              try {
                if (videoRef.current) videoRef.current.currentTime = 0;
              } catch (e) {
                console.debug("onLoadedMetadata reset failed:", e?.message);
              }
            }}
          />
        ) : (
          <img
            src={poster || ""}
            alt={name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              // poster yok/kırıksa siyah kare yerine nötr arka plan
              e.currentTarget.style.background = "#f3f4f6";
              e.currentTarget.src = "";
            }}
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
          />
        )}

        {/* Ses butonu — sadece desktop + hover sırasında */}
        {shouldShowVideo && isHoverCapable && isHovered && (
          <button
            onClick={toggleMute}
            className="hidden md:flex absolute top-2 right-2 bg-white/90 p-2 rounded-full shadow-md z-10 hover:scale-110 transition"
            aria-label={isMuted ? "Sesi aç" : "Sesi kapat"}
          >
            {isMuted ? (
              <FaVolumeMute className="text-dark2" />
            ) : (
              <FaVolumeUp className="text-dark2" />
            )}
          </button>
        )}

        {/* Mobil “oynat” katmanı */}
        {isTouch && !!video && !mobileWantsPlay && (
          <button
            onClick={handleMobilePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/20"
            aria-label="Videoyu oynat"
          >
            <span className="flex items-center justify-center w-11 h-11 rounded-full bg-white/90 shadow">
              <FaPlay className="text-dark2" />
            </span>
          </button>
        )}

        {/* İndirim Rozeti */}
        {hasDiscount && (
          <span className="absolute bottom-2 left-2 z-10 inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-600 text-white text-[10px] font-bold shadow">
            -{pct}%
          </span>
        )}
      </div>

      {/* İçerik */}
      <div className="flex flex-col justify-between flex-grow p-4 space-y-2">
        <h4 className="text-dark1 text-sm font-semibold leading-snug line-clamp-2 text-center">
          {name}
        </h4>
        {hasDiscount ? (
          <div className="text-center">
            <p className="text-xs text-gray-500 line-through">
              {price.toFixed(2)}₺
            </p>
            <p className="text-sm font-bold text-red-600">
              {discountedPrice.toFixed(2)}₺
            </p>
          </div>
        ) : (
          <p className="text-dark1 font-bold text-sm text-center mt-1">
            {price.toFixed(2)}₺
          </p>
        )}
      </div>
    </Link>
  );
}

SimilarProductItem.propTypes = {
  id: PropTypes.string.isRequired,
  video: PropTypes.string.isRequired,
  poster: PropTypes.string, // opsiyonel
  name: PropTypes.string.isRequired,
  price: PropTypes.number.isRequired,
  discountedPrice: PropTypes.number,
};
