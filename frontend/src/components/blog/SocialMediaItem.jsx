import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";

export default function SocialMediaItem({ embedLink, caption }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!document.getElementById("instagram-embed-script")) {
      const script = document.createElement("script");
      script.id = "instagram-embed-script";
      script.async = true;
      script.src = "https://www.instagram.com/embed.js";
      document.body.appendChild(script);
    } else {
      window.instgrm?.Embeds?.process();
    }
  }, []);

  useEffect(() => {
    window.instgrm?.Embeds?.process();
  }, [embedLink]);

  return (
    <div className="w-full">
      <blockquote
        ref={containerRef}
        className="instagram-media"
        data-instgrm-permalink={embedLink}
        data-instgrm-version="14"
        style={{
          background: "#fff",
          border: 0,
          margin: 0,
          padding: 0,
          width: "100%",
        }}
      ></blockquote>
      {caption && (
        <p className="text-sm text-gray-600 text-center mt-2 px-2 line-clamp-2">
          {caption}
        </p>
      )}
    </div>
  );
}
