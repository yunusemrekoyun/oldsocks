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
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  return (
    <Link
      to={`/product-details`}
      className="block relative bg-white rounded-xl overflow-hidden shadow hover:shadow-lg transition-shadow duration-300 group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {isHovered && (
        <button
          onClick={toggleMute}
          className="absolute top-2 right-2 bg-light1 p-1 rounded-full shadow z-10 hover:scale-110 transition"
        >
          {isMuted ? (
            <FaVolumeMute className="text-dark2" />
          ) : (
            <FaVolumeUp className="text-black" />
          )}
        </button>
      )}

      <video
        ref={videoRef}
        src={video}
        muted={isMuted}
        playsInline
        preload="metadata"
        className="w-full h-64 object-contain transition duration-300"
      />

      <div className="p-4 text-center bg-light2">
        <h3 className="text-sm font-medium text-dark2">{name}</h3>
        <div className="flex items-center justify-center mt-2 space-x-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <FaStar
              key={i}
              className={`h-4 w-4 ${
                i < rating ? "text-yellow-400" : "text-light2"
              }`}
            />
          ))}
        </div>
        <p className="mt-2 font-semibold text-black">${price.toFixed(2)}</p>
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
