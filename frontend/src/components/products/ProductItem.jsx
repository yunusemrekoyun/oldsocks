// src/components/products/ProductItem.jsx
import React, { useRef, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { FaVolumeMute, FaVolumeUp, FaStar } from "react-icons/fa";

const ProductItem = ({ video, name, price, rating }) => {
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

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
      const newMuteState = !videoRef.current.muted;
      videoRef.current.muted = newMuteState;
      setIsMuted(newMuteState);
    }
  };

  return (
    <Link
      to="/product-details"
      className="block relative bg-white rounded-lg overflow-hidden shadow hover:shadow-lg transition p-4"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Ses kontrol butonu */}
      {isHovered && (
        <button
          className="absolute top-3 right-3 bg-white p-1 rounded-full shadow z-10"
          onClick={toggleMute}
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
        className="w-full h-56 object-contain mb-4 rounded transition-transform duration-300"
      />

      <h3 className="text-sm font-medium text-gray-700 mb-2">{name}</h3>
      <div className="flex items-center mb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <FaStar
            key={i}
            className={`h-4 w-4 ${
              i < rating ? "text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
      <p className="text-base font-semibold text-gray-900">
        ${price.toFixed(2)}
      </p>
    </Link>
  );
};

ProductItem.propTypes = {
  video: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  price: PropTypes.number.isRequired,
  rating: PropTypes.number,
};

ProductItem.defaultProps = {
  rating: 0,
};

export default ProductItem;
