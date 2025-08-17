
// src/components/products/ProductItem.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { FaVolumeMute, FaVolumeUp, FaPlay } from "react-icons/fa";

const MOBILE_VIDEO_EVENT = "product-mobile-play";

const ProductItem = ({
  id,
  video,
  poster,
  name,
  price,
  discountedPrice,
  discountRate,
  stock,
}) => {
  const videoRef = useRef(null);

  // Cihaz yetenekleri
  const [isHoverCapable, setIsHoverCapable] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  // Desktop’ta hover state’i, mobilde “oynat”a basıldı mı?
  const [isHovered, setIsHovered] = useState(false);
  const [mobileWantsPlay, setMobileWantsPlay] = useState(false);

  // Ses durumu (sadece desktop’ta ikon gösterilecek)
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

  const showDiscount = useMemo(
    () => discountedPrice != null && discountedPrice < price,
    [discountedPrice, price]
  );

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

    // diğer kartlara "dur" sinyali gönder
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

  // Başka ürün oynatılınca kendini durdur
  useEffect(() => {
    const handler = (e) => {
      if (e.detail !== id && videoRef.current) {
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

  // Unmount olduğunda oynuyorsa durdur (sayfa değişimi vb.)
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        try {
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

      {/* Ses butonu — sadece desktop’ta ve video görünürken + hover aktifken */}
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

      {/* İndirim rozeti */}
      {showDiscount && (
        <div className="absolute left-3 bottom-3 z-10">
          <div className="bg-red-600 text-white w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shadow-md translate-y-[-4px]">
            %{discountRate}
          </div>
        </div>
      )}

      <div className="relative h-64 overflow-hidden bg-light1">
        {shouldShowVideo ? (
          <video
            ref={videoRef}
            src={video}
            poster={poster || undefined}
            muted
            playsInline
            preload={isHoverCapable ? "metadata" : "none"}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
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
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.background = "#f3f4f6";
              e.currentTarget.src = "";
            }}
          />
        )}

        {/* Mobilde “Oynat” butonu (video varsa & henüz oynatılmıyorsa) */}
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

      {/* Metin / Fiyat */}
      <div className="p-4 text-center">
        <h3 className="text-sm font-medium text-dark1 mb-2">{name}</h3>

        {showDiscount ? (
          <div>
            <p className="text-sm text-gray-500 line-through">
              {price.toFixed(2)}₺
            </p>
            <p className="text-lg font-bold text-dark2">
              {discountedPrice.toFixed(2)}₺
            </p>
          </div>
        ) : (
          <p className="text-lg font-semibold text-dark2">
            {price.toFixed(2)}₺
          </p>
        )}
      </div>
    </Link>
  );
};

ProductItem.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  video: PropTypes.string,
  poster: PropTypes.string,
  name: PropTypes.string.isRequired,
  price: PropTypes.number.isRequired,
  discountedPrice: PropTypes.number,
  discountRate: PropTypes.number,
  stock: PropTypes.number,
};

ProductItem.defaultProps = {
  video: null,
  poster: null,
  discountedPrice: null,
  discountRate: 0,
  stock: undefined,
};

export default ProductItem;
