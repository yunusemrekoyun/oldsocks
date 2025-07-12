// src/components/ProductGridItem.jsx
import React, { useRef, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { FaStar, FaVolumeMute, FaVolumeUp } from "react-icons/fa";

const ProductGridItem = ({ video, name, price, rating }) => {
  const videoRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoRef.current) {
      videoRef.current.play();
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
      const muted = !videoRef.current.muted;
      videoRef.current.muted = muted;
      setIsMuted(muted);
    }
  };

  return (
    <Link
      to={`/product-details`}
      className="block relative bg-white rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow duration-300 group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Ses kontrol butonu */}
      {isHovered && (
        <button
          onClick={toggleMute}
          className="absolute top-2 right-2 bg-white p-1 rounded-full shadow z-10"
        >
          {isMuted ? (
            <FaVolumeMute className="text-gray-500" />
          ) : (
            <FaVolumeUp className="text-purple-600" />
          )}
        </button>
      )}

      <video
        ref={videoRef}
        src={video}
        muted
        playsInline
        preload="metadata"
        className="w-full h-64 object-contain rounded transition-transform duration-300"
      />

      <div className="p-4 text-center">
        <h3 className="text-sm font-medium text-gray-700">{name}</h3>
        <div className="flex items-center justify-center mt-2 space-x-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <FaStar
              key={i}
              className={`h-4 w-4 ${
                i < rating ? "text-yellow-400" : "text-gray-300"
              }`}
            />
          ))}
        </div>
        <p className="mt-2 font-semibold text-gray-900">${price.toFixed(2)}</p>
      </div>
    </Link>
  );
};

ProductGridItem.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  video: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  price: PropTypes.number.isRequired,
  rating: PropTypes.number,
};

ProductGridItem.defaultProps = {
  rating: 0,
};

export default ProductGridItem;
