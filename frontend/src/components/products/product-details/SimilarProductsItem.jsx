// src/components/products/SimilarProductItem.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { FaVolumeMute, FaVolumeUp, FaPlay } from "react-icons/fa";
import api from "../../../../api";

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

  // İndirim var mı?
  const hasDiscount =
    typeof discountedPrice === "number" && discountedPrice < price;

  const pct = useMemo(() => {
    if (!hasDiscount) return 0;
    const val = Math.round(100 - (discountedPrice / price) * 100);
    return Math.max(1, val);
  }, [hasDiscount, discountedPrice, price]);

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
    window.dispatchEvent(new CustomEvent(MOBILE_VIDEO_EVENT, { detail: id }));
    setMobileWantsPlay(true);
    requestAnimationFrame(() => {
      videoRef.current?.play().catch(() => {});
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
      try {
        videoRef.current?.pause();
      } catch {}
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
  const shouldShowVideo =
    !!video && (isHoverCapable || (isTouch && mobileWantsPlay));

  const colorDots = variants.length ? variants : [];

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

        {/* ► DİKEY RENK NOKTALARI */}
        {loadingColors ? (
          <div className="absolute bottom-2 right-2 z-10 pointer-events-none">
            <span className="block w-5 h-10 bg-white/50 rounded-md shadow-sm animate-pulse" />
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