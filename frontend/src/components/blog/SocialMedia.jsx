import React, { useEffect, useState } from "react";
import SocialMediaItem from "./SocialMediaItem";
import api from "../../../api";

export default function SocialMedia() {
  const [posts, setPosts] = useState([]);

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
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar cursor-grab active:cursor-grabbing">
          {posts.map((post) => (
            <div
              key={post._id}
              className="flex-shrink-0 snap-start w-[320px] sm:w-[360px] md:w-[400px] bg-white rounded-xl shadow-md overflow-hidden"
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
