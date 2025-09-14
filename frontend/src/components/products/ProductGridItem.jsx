import React, { useEffect, useRef, useState, useMemo } from "react";
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

  /* ----- Varyant renklerini çek ----- */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoadingColors(true);
        const { data: prod } = await api.get(`/products/${id}`);
        const baseId = prod?.parentProductId || prod?._id;
        if (!baseId) {
          if (alive) setVariants(prod?.color ? [{ _id: id, color: prod.color }] : []);
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

  /* ---------- Desktop (hover) ---------- */
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
    const handler = (ev) => {
      if (ev.detail !== id && videoRef.current) {
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

  /* ---------- Ses toggle ---------- */
  const toggleMute = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  };

  const shouldShowVideo =
    !!video && (isHoverCapable || (isTouch && mobileWantsPlay));

  const colorDots = useMemo(() => (variants.length ? variants : []), [variants]);

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
              } catch {}
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

        {/* ► DİKEY RENK NOKTALARI */}
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

      {/* İçerik */}
      <div className="p-4 relative">
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