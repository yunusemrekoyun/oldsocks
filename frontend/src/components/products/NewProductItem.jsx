// src/components/products/NewProductItem.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { FaVolumeMute, FaVolumeUp, FaPlay } from "react-icons/fa";

const MOBILE_VIDEO_EVENT = "product-mobile-play";

export default function NewProductItem({
  id,
  video,
  poster,
  name,
  price,
  originalPrice,
  discountPercentage,
  stock,
}) {
  const videoRef = useRef(null);

  // Cihaz yetenekleri
  const [isHoverCapable, setIsHoverCapable] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  // Desktop: hover durumu — Mobil: kullanıcı “oynat”a dokundu mu?
  const [isHovered, setIsHovered] = useState(false);
  const [mobileWantsPlay, setMobileWantsPlay] = useState(false);

  // Ses durumu (yalnız desktop’ta ikon gösteriyoruz)
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

  const hasDiscount = useMemo(
    () => Number(discountPercentage || 0) > 0,
    [discountPercentage]
  );

  const discountedPrice = useMemo(() => {
    if (!hasDiscount) return Number(price || 0);
    const p = Math.max(
      0,
      (Number(price || 0) * (100 - Number(discountPercentage))) / 100
    );
    return p;
  }, [price, discountPercentage, hasDiscount]);

  const fmt = (n) =>
    `${Number(n || 0).toLocaleString("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}₺`;

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

    // Diğer kartlara “dur” sinyali gönder
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

  // Başka bir item oynatıldığında kendini durdur
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

  // Unmount’ta güvenli durdur
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
  // Desktop: video elementini göster (hover’da oynar)
  // Mobil: poster göster, kullanıcı oynatırsa video’ya geç
  const shouldShowVideo =
    !!video && (isHoverCapable || (isTouch && mobileWantsPlay));

  return (
    <Link
      to={`/product-details/${id}`}
      className="group relative rounded-xl overflow-hidden bg-white shadow border border-light2 hover:shadow-xl transition-all duration-300"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Stok etiketi */}
      {stock === 0 && (
        <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded shadow z-20">
          TÜKENDİ
        </div>
      )}

      {/* Ses butonu — sadece desktop’ta ve hover sırasında */}
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

      {/* Medya alanı */}
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

      {/* İçerik alanı + indirim rozeti */}
      <div className="relative p-4">
        {hasDiscount && (
          <div className="absolute bottom-4 left-2 bg-red-600 text-white text-xs font-bold w-10 h-10 flex items-center justify-center rounded-full shadow z-20">
            %{discountPercentage}
          </div>
        )}

        <h3 className="text-sm font-medium text-dark1 mb-2 text-center">
          {name}
        </h3>

        {/* Fiyatlar */}
        {hasDiscount ? (
          <div className="text-center">
            <div className="text-xs text-gray-500 line-through">
              {fmt(originalPrice || price)}
            </div>
            <div className="text-base font-semibold text-dark2">
              {fmt(discountedPrice)}
            </div>
          </div>
        ) : (
          <p className="text-center text-base font-semibold text-dark2">
            {fmt(price)}
          </p>
        )}
      </div>
    </Link>
  );
}

NewProductItem.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  video: PropTypes.string,
  poster: PropTypes.string,
  name: PropTypes.string.isRequired,
  price: PropTypes.number.isRequired,
  originalPrice: PropTypes.number,
  discountPercentage: PropTypes.number,
  stock: PropTypes.number.isRequired,
};

NewProductItem.defaultProps = {
  video: null,
  poster: null,
  originalPrice: undefined,
  discountPercentage: 0,
};
