// src/components/products/ProductItem.jsx
import React, { useRef, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { FaVolumeMute, FaVolumeUp } from "react-icons/fa";

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
  const [isHovered, setIsHovered] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoRef.current && video) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
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

  const showDiscount = discountedPrice != null && discountedPrice < price;

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

      {/* Ses butonu */}
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

      {/* İndirim rozeti (sol-alt, hafif yukarı çekilmiş) */}
      {showDiscount && (
        <div className="absolute left-3 bottom-3 z-10">
          <div className="bg-red-600 text-white w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shadow-md translate-y-[-4px]">
            %{discountRate}
          </div>
        </div>
      )}

      <div className="relative h-64 overflow-hidden bg-light1">
        {video ? (
          <video
            ref={videoRef}
            src={video}
            // poster sadece varsa verelim; yoksa tarayıcı ilk kareyi çizsin
            poster={poster || undefined}
            muted
            playsInline
            preload="auto" // ← metadata yerine auto
            onLoadedMetadata={() => {
              try {
                if (videoRef.current) videoRef.current.currentTime = 0;
              } catch {
                console.error("Video oynatılırken hata");
              }
            }}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <img
            src={poster}
            alt={name}
            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
          />
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
