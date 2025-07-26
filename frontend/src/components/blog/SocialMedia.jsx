import React, { useEffect, useState, useRef } from "react";
import SocialMediaItem from "./SocialMediaItem";
import api from "../../../api";

export default function SocialMedia() {
  const [posts, setPosts] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    api
      .get("/instagram-posts")
      .then(({ data }) => setPosts(data.filter((p) => p.active)))
      .catch(console.error);
  }, []);

  return (
    <div className="bg-[#f4f4f4] p-6 rounded-lg shadow-sm w-full">
      <h4 className="text-xl font-semibold text-[#0b0b0d] mb-4 border-b border-[#d9d9d9] pb-2">
        Instagram Feeds
      </h4>

      {posts.length === 0 ? (
        <p className="text-center text-gray-500">Henüz gönderi yok.</p>
      ) : (
        <div
          ref={scrollRef}
          className="flex overflow-x-auto gap-4 px-1 sm:px-2 md:px-4 scroll-smooth snap-x snap-mandatory no-scrollbar cursor-grab active:cursor-grabbing"
          style={{
            WebkitOverflowScrolling: "touch",
          }}
        >
          {posts.map((post) => (
            <div
              key={post._id}
              className="snap-start flex-shrink-0 w-[280px] sm:w-[320px] md:w-[360px] lg:w-[400px] bg-white rounded-xl shadow-md"
            >
              <SocialMediaItem
                embedLink={post.embedLink}
                caption={post.caption}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
