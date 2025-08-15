import React, { useRef, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { FaVolumeMute, FaVolumeUp } from "react-icons/fa";

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
  const [isHovered, setIsHovered] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoRef.current && video) {
      const videoEl = videoRef.current;
      const tryPlay = async () => {
        try {
          videoEl.muted = isMuted;
          await videoEl.play();
        } catch (error) {
          console.warn("Video oynatılırken hata:", error);
        }
      };
      tryPlay();
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current) {
      const videoEl = videoRef.current;
      videoEl.pause();
      setTimeout(() => {
        if (videoEl.readyState >= 1) {
          videoEl.currentTime = 0;
        }
      }, 100);
    }
  };

  const toggleMute = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

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

      {isHovered && video && (
        <button
          onClick={toggleMute}
          className="absolute top-3 right-3 bg-white border border-gray-200 p-1 rounded-full z-10 shadow-md hover:border-purple-500 transition"
        >
          {isMuted ? (
            <FaVolumeMute className="text-dark2 text-sm" />
          ) : (
            <FaVolumeUp className="text-purple-600 text-sm" />
          )}
        </button>
      )}

      <div className="relative w-full aspect-[3/4] bg-black">
        <video
          ref={videoRef}
          src={video}
          poster={poster}
          muted={isMuted}
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover transition duration-300"
        />
      </div>

      {/* İçerik alanını relative yap: rozet burada beyaz zeminde görünsün */}
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
