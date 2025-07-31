import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { FaVolumeMute, FaVolumeUp, FaStar } from "react-icons/fa";

export default function SimilarProductItem({ id, video, name, price }) {
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
      className="group relative rounded-2xl overflow-hidden bg-white shadow-md hover:shadow-xl border border-light2 transition-all duration-300 flex flex-col h-full"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {/* Video Alanı */}
      <div className="relative h-64 overflow-hidden bg-light1">
        <video
          ref={videoRef}
          src={video}
          muted
          playsInline
          preload="metadata"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {hovered && (
          <button
            onClick={toggleMute}
            className="absolute top-2 right-2 bg-white/90 p-2 rounded-full shadow-md z-10 hover:scale-110 transition"
          >
            {muted ? (
              <FaVolumeMute className="text-dark2" />
            ) : (
              <FaVolumeUp className="text-dark2" />
            )}
          </button>
        )}
      </div>

      {/* İçerik */}
      <div className="flex flex-col justify-between flex-grow p-4 space-y-2">
        <h4 className="text-dark1 text-sm font-semibold leading-snug line-clamp-2 text-center">
          {name}
        </h4>

        <p className="text-dark1 font-bold text-sm text-center mt-1">
          {price.toFixed(2)}₺
        </p>
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
