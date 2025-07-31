import React, { useEffect, useRef } from "react";

export default function SocialMediaItem({ embedLink, caption }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!document.getElementById("instagram-embed-script")) {
      const script = document.createElement("script");
      script.id = "instagram-embed-script";
      script.src = "https://www.instagram.com/embed.js";
      script.async = true;
      document.body.appendChild(script);
    } else {
      window.instgrm?.Embeds?.process();
    }
  }, []);

  useEffect(() => {
    window.instgrm?.Embeds?.process();
  }, [embedLink]);

  return (
    <div className="w-full h-full flex flex-col justify-between">
      <div
        className="w-full h-full overflow-hidden"
        style={{
          transform: "scale(1.01)",
          transformOrigin: "center",
        }}
      >
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
            minWidth: "100%",
          }}
        ></blockquote>
      </div>
      {caption && (
        <p className="text-xs text-gray-600 text-center mt-2 px-2 line-clamp-2">
          {caption}
        </p>
      )}
    </div>
  );
}
