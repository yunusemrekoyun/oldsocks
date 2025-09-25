/* eslint-disable no-empty */
// src/components/products/ProductItem.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { FaVolumeMute, FaVolumeUp, FaPlay } from "react-icons/fa";
import api from "../../../api";

const MOBILE_VIDEO_EVENT = "product-mobile-play";

/* TR/EN renk adlarını güvenli CSS rengine çevir */
const colorMap = {
  siyah: "#000000",
  black: "#000000",
  beyaz: "#ffffff",
  white: "#ffffff",
  kırmızı: "#ff0000",
  kirmizi: "#ff0000",
  red: "#ff0000",
  mavi: "#0000ff",
  blue: "#0000ff",
  lacivert: "#001a4d",
  navy: "#001a4d",
  yeşil: "#008000",
  yesil: "#008000",
  green: "#008000",
  sarı: "#ffd100",
  sari: "#ffd100",
  yellow: "#ffd100",
  pembe: "#ff69b4",
  pink: "#ff69b4",
  mor: "#6a0dad",
  purple: "#6a0dad",
  gri: "#808080",
  gray: "#808080",
  grey: "#808080",
  kahverengi: "#8b4513",
  brown: "#8b4513",
  turuncu: "#ff7f00",
  orange: "#ff7f00",
  bej: "#f5f5dc",
  beige: "#f5f5dc",
};
const toCssColor = (val) => {
  if (!val) return "#ddd";
  const k = String(val).trim().toLowerCase();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(k)) return k;
  if (/^rgba?\(/i.test(k)) return k;
  return colorMap[k] || k;
};

// TL formatlayıcı
const fmtTL = (n) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(n);

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

  // cihaz / etkileşim
  const [isHoverCapable, setIsHoverCapable] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [mobileWantsPlay, setMobileWantsPlay] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // renk varyantları
  const [variants, setVariants] = useState([]); // [{_id, color}]
  const [loadingColors, setLoadingColors] = useState(true);

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

  /** ------------------ Fiyat Mantığı (double-discount fix) ------------------ **/
  const cleanPrice = useMemo(() => Number(price) || 0, [price]);
  const hasDiscountedPrice = useMemo(
    () => discountedPrice !== null && discountedPrice !== undefined,
    [discountedPrice]
  );

  // Final satış fiyatı:
  // 1) discountedPrice varsa -> onu kullan (asla oran uygulama)
  // 2) yoksa ve discountRate > 0 ise -> price * (1 - rate/100)
  // 3) aksi halde -> price
  const finalPrice = useMemo(() => {
    if (hasDiscountedPrice) return Number(discountedPrice) || 0;
    const rateNum = Number(discountRate) || 0;
    if (rateNum > 0 && cleanPrice > 0) {
      const v = cleanPrice * (1 - rateNum / 100);
      return v < 0 ? 0 : v;
    }
    return cleanPrice;
  }, [hasDiscountedPrice, discountedPrice, discountRate, cleanPrice]);

  // İndirim var mı?
  const showDiscount = useMemo(
    () => cleanPrice > 0 && finalPrice < cleanPrice,
    [cleanPrice, finalPrice]
  );

  // Rozette gösterilecek oran:
  const badgeRate = useMemo(() => {
    if (!showDiscount || cleanPrice <= 0) return 0;
    if (hasDiscountedPrice) {
      const pct = Math.round(100 - (finalPrice / cleanPrice) * 100);
      return pct > 0 ? pct : 0;
    }
    const pct = Math.round(Number(discountRate) || 0);
    return pct > 0 ? pct : 0;
  }, [showDiscount, hasDiscountedPrice, discountRate, cleanPrice, finalPrice]);

  /* ----- Varyant renklerini çek ----- */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoadingColors(true);
        const { data: prod } = await api.get(`/products/${id}`);
        const baseId = prod?.parentProductId || prod?._id;
        if (!baseId) {
          if (alive)
            setVariants(prod?.color ? [{ _id: id, color: prod.color }] : []);
          return;
        }
        const { data: group } = await api.get(`/products?varyantsOf=${baseId}`);
        const normalized = Array.isArray(group)
          ? group.filter((v) => !!v.color)
          : [];
        if (alive) setVariants(normalized);
      } catch {
        if (alive) setVariants([]);
      } finally {
        if (alive) setLoadingColors(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  /* ---------- hover davranışı ---------- */
  const handleMouseEnter = () => {
    if (!isHoverCapable) return;
    setIsHovered(true);
    if (videoRef.current && video) {
      videoRef.current.play().catch(() => {});
    }
  };
  const handleMouseLeave = () => {
    if (!isHoverCapable) return;
    setIsHovered(false);
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      } catch {}
    }
  };

  /* ---------- Mobile: “oynat” overlay ---------- */
  const handleMobilePlay = (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent(MOBILE_VIDEO_EVENT, { detail: id }));
    setMobileWantsPlay(true);
    requestAnimationFrame(() => {
      videoRef.current?.play().catch(() => {});
    });
  };
  useEffect(() => {
    const handler = (e) => {
      if (e.detail !== id && videoRef.current) {
        try {
          videoRef.current.pause();
          videoRef.current.currentTime = 0;
        } catch {}
        setMobileWantsPlay(false);
      }
    };
    window.addEventListener(MOBILE_VIDEO_EVENT, handler);
    return () => window.removeEventListener(MOBILE_VIDEO_EVENT, handler);
  }, [id]);

  useEffect(() => {
    return () => {
      try {
        videoRef.current?.pause();
      } catch {}
    };
  }, []);

  const toggleMute = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const shouldShowVideo =
    !!video && (isHoverCapable || (isTouch && mobileWantsPlay));

  // gösterilecek renk noktaları
  const colorDots = useMemo(
    () => (variants.length ? variants : []),
    [variants]
  );

  return (
    <Link
      to={`/product-details/${id}`}
      className="group relative rounded-xl overflow-hidden bg-white shadow border border-light2 hover:shadow-xl transition-all duration-300"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* ses butonu */}
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

      {/* MEDYA ALANI */}
      <div className="relative h-64 overflow-hidden bg-light1">
        {/* İndirim Rozeti: mobilde küçük, daha genişte büyür; sol-üst */}
        {showDiscount && badgeRate > 0 && (
          <div className="absolute top-2 left-2 z-10">
            <div className="bg-red-600 text-white rounded-full shadow-md flex items-center justify-center font-bold w-7 h-7 text-[9px] sm:w-8 sm:h-8 sm:text-[10px] md:w-10 md:h-10 md:text-xs">
              %{badgeRate}
            </div>
          </div>
        )}

        {/* TÜKENDİ — medya alanının sol-altında */}
        {stock === 0 && (
          <div className="absolute bottom-2 left-2 bg-red-600 text-white text-[10px] sm:text-xs px-2 py-1 rounded shadow z-10">
            TÜKENDİ
          </div>
        )}

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
              } catch {}
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

        {/* ► DİKEY RENK NOKTALARI — SAĞ ALT, MEDYA İÇİ */}
        {loadingColors ? (
          <div className="absolute bottom-2 right-2 z-10 pointer-events-none">
            <span className="block w-6 h-12 bg-white/50 rounded-md shadow-sm animate-pulse" />
          </div>
        ) : colorDots.length > 0 ? (
          <div className="absolute bottom-2 right-2 z-10 pointer-events-none flex flex-col gap-1">
            {colorDots.map((v) => (
              <span
                key={v._id}
                className="inline-block w-2.5 h-2.5 rounded-full border shadow-sm"
                style={{
                  background: toCssColor(v.color),
                  borderColor: "rgba(255,255,255,.95)",
                }}
                title={v.color}
                aria-label={v.color}
              />
            ))}
          </div>
        ) : null}

        {/* Mobil “Oynat” */}
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

      {/* METİN / FİYAT */}
      <div className="p-4 text-center">
        <h3 className="text-sm font-medium text-dark1 mb-2">{name}</h3>

        {showDiscount ? (
          <div>
            <p className="text-sm text-gray-500 line-through">
              {fmtTL(cleanPrice)}
            </p>
            <p className="text-lg font-bold text-dark2">{fmtTL(finalPrice)}</p>
          </div>
        ) : (
          <p className="text-lg font-semibold text-dark2">
            {fmtTL(finalPrice)}
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
