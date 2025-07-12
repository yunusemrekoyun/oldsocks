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
    if (videoRef.current) videoRef.current.play();
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
      const newMuted = !videoRef.current.muted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
    }
  };

  return (
    <Link
      to="/product-details"
      className="group relative rounded-xl overflow-hidden bg-white shadow border border-light2 hover:shadow-xl transition-all duration-300"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Ses İkonu */}
      {isHovered && (
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

      <div className="bg-light1 h-56 flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          src={video}
          muted
          playsInline
          preload="metadata"
          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <div className="p-4">
        <h3 className="text-sm font-medium text-dark1 mb-2 text-center">
          {name}
        </h3>
        <div className="flex justify-center gap-1 mb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <FaStar
              key={i}
              className={`h-4 w-4 ${
                i < rating ? "text-yellow-400" : "text-light2"
              }`}
            />
          ))}
        </div>
        <p className="text-center text-base font-semibold text-dark2">
          ${price.toFixed(2)}
        </p>
      </div>
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
