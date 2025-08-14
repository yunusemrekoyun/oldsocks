import React, { useRef, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { FaVolumeMute, FaVolumeUp } from "react-icons/fa";

// ProductGridItem ile birebir stil & davranış
export default function NewProductItem({ id, video, poster, name, price, stock }) {
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
      // Postere geri dönsün
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

      <div className="p-4">
        <h3 className="text-sm font-medium text-dark1 mb-2 text-center">
          {name}
        </h3>
        <p className="text-center text-base font-semibold text-dark2">
          {price?.toFixed ? price.toFixed(2) : Number(price || 0).toFixed(2)}₺
        </p>
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
  stock: PropTypes.number.isRequired,
};

NewProductItem.defaultProps = {
  video: null,
  poster: null,
};