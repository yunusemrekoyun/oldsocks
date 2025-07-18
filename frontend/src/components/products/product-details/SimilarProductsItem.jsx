import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { FaVolumeMute, FaVolumeUp, FaStar } from "react-icons/fa";

export default function SimilarProductItem({ id, video, name, price, rating }) {
  const videoRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [muted, setMuted] = useState(true);

  const onEnter = () => {
    setHovered(true);
    videoRef.current?.play();
  };
  const onLeave = () => {
    setHovered(false);
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
      setMuted(videoRef.current.muted);
    }
  };

  return (
    <Link
      to={`/product-details/${id}`}
      className="group relative rounded-xl overflow-hidden bg-white shadow hover:shadow-lg transition flex flex-col h-full"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <div className="relative">
        <video
          ref={videoRef}
          src={video}
          muted
          playsInline
          preload="metadata"
          className="w-full h-48 object-contain transition-transform duration-300 group-hover:scale-105 bg-gray-100"
        />
        {hovered && (
          <button
            onClick={toggleMute}
            className="absolute top-2 right-2 bg-white p-1 rounded-full shadow z-10"
          >
            {muted ? <FaVolumeMute /> : <FaVolumeUp />}
          </button>
        )}
      </div>
      <div className="p-3 text-center flex flex-col justify-between flex-grow">
        <h4 className="text-sm font-medium line-clamp-2">{name}</h4>
        <div className="flex justify-center my-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <FaStar
              key={i}
              className={`h-4 w-4 ${
                i < rating ? "text-yellow-400" : "text-gray-300"
              }`}
            />
          ))}
        </div>
        <p className="mt-1 font-semibold text-primary">${price.toFixed(2)}</p>
      </div>
    </Link>
  );
}

SimilarProductItem.propTypes = {
  id: PropTypes.string.isRequired,
  video: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  price: PropTypes.number.isRequired,
  rating: PropTypes.number,
};

SimilarProductItem.defaultProps = {
  rating: 0,
};
