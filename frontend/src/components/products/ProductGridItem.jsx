
// src/components/products/ProductGridItem.jsx
import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { FaVolumeMute, FaVolumeUp, FaPlay } from "react-icons/fa";

const MOBILE_VIDEO_EVENT = "product-mobile-play";

const ProductGridItem = ({
  id,
  video,
  poster,
  name,
  price,
  originalPrice,
  discount,
  stock,
}) => {
  const videoRef = useRef(null);

  // Cihaz yetenekleri
  const [isHoverCapable, setIsHoverCapable] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  // Desktop: hover; Mobil: kullanıcı oynat’a bastı mı?
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

  // ---- İndirim hesapları ----
  const rate = Number(discount || 0);
  const hasDiscount =
    rate > 0 ||
    (Number.isFinite(originalPrice) && Number(originalPrice) > Number(price));

  const discountPercentage = Math.min(100, Math.max(0, Math.round(rate)));
  const discountedPrice =
    hasDiscount && rate > 0
      ? Math.max(0, Number(((price * (100 - rate)) / 100).toFixed(2)))
      : Number(price || 0);

  const fmt = (n) =>
    Number(n || 0).toLocaleString("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  /* ---------- Desktop (hover) davranışı ---------- */
  const handleMouseEnter = () => {
    if (!isHoverCapable) return;
    setIsHovered(true);
    if (videoRef.current && video) {
      videoRef.current
        .play()
        .catch((e) => console.debug("Video play blocked (hover):", e?.message));
    }
  };

  const handleMouseLeave = () => {
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

  /* ---------- Mobile: “oynat” overlay ---------- */
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

  // Video mu gösterelim, poster mı?
  // Desktop: video elemanı görünür (hover’da oynar)
  // Mobil: poster, oynatılırsa video’ya geç
  const shouldShowVideo =
    !!video && (isHoverCapable || (isTouch && mobileWantsPlay));

  return (
    <Link
      to={`/product-details/${id}`}
      className="group relative rounded-xl overflow-hidden bg-white shadow border border-light2 hover:shadow-xl transition-all duration-300"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {stock === 0 && (
        <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded shadow z-20">
          TÜKENDİ
        </div>
      )}

      {/* Ses butonu — sadece desktop + hover sırasında */}
      {shouldShowVideo && isHoverCapable && isHovered && (
        <button
          onClick={toggleMute}
          className="hidden md:flex absolute top-3 right-3 bg-white border border-gray-200 p-1 rounded-full z-10 shadow-md hover:border-purple-500 transition"
          aria-label={isMuted ? "Sesi aç" : "Sesi kapat"}
        >
          {isMuted ? (
            <FaVolumeMute className="text-dark2 text-sm" />
          ) : (
            <FaVolumeUp className="text-purple-600 text-sm" />
          )}
        </button>
      )}

      <div className="relative w-full aspect-[3/4] bg-light1">
        {shouldShowVideo ? (
          <video
            ref={videoRef}
            src={video || undefined}
            poster={poster || undefined}
            muted
            playsInline
            preload={isHoverCapable ? "metadata" : "none"}
            className="absolute inset-0 w-full h-full object-cover transition duration-300 group-hover:scale-105"
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
            className="absolute inset-0 w-full h-full object-cover transition duration-300 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.background = "#f3f4f6";
              e.currentTarget.src = "";
            }}
          />
        )}

        {/* Mobil “oynat” katmanı */}
        {isTouch && !!video && !mobileWantsPlay && (
          <button
            onClick={handleMobilePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/20"
            aria-label="Videoyu oynat"
          >
            <span className="flex items-center justify-center w-12 h-12 rounded-full bg-white/90 shadow">
              <FaPlay className="text-dark2" />
            </span>
          </button>
        )}
      </div>

      {/* İçerik alanı */}
      <div className="p-4 relative">
        {/* İndirim rozeti */}
        {hasDiscount && discountPercentage > 0 && (
          <div className="absolute bottom-3 left-3 bg-red-600 text-white text-xs font-bold w-10 h-10 flex items-center justify-center rounded-full shadow z-20">
            %{discountPercentage}
          </div>
        )}

        <h3 className="text-sm font-medium text-dark1 mb-2 text-center">
          {name}
        </h3>

        {hasDiscount ? (
          <div className="flex flex-col items-center gap-0.5">
            <div className="text-sm text-dark2 line-through opacity-70">
              {fmt(originalPrice || price)}₺
            </div>
            <div className="text-center text-base font-semibold text-dark1">
              {fmt(discountedPrice)}₺
            </div>
          </div>
        ) : (
          <p className="text-center text-base font-semibold text-dark2">
            {fmt(price)}₺
          </p>
        )}
      </div>
    </Link>
  );
};

ProductGridItem.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  video: PropTypes.string,
  poster: PropTypes.string,
  name: PropTypes.string.isRequired,
  price: PropTypes.number.isRequired,
  originalPrice: PropTypes.number,
  discount: PropTypes.number,
  stock: PropTypes.number.isRequired,
};

ProductGridItem.defaultProps = {
  video: null,
  poster: null,
  originalPrice: 0,
  discount: 0,
};

export default ProductGridItem;
