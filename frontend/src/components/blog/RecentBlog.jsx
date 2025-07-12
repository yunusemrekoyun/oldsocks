// src/components/RecentBlog.jsx
import React from "react";
import RecentBlogItem from "./RecentBlogItem";
import b1 from "../../assets/blog/blog1.png";
import b2 from "../../assets/blog/blog2.png";
import b3 from "../../assets/blog/blog3.png";

const posts = [
  {
    id: 1,
    image: b1,
    title: "From life was you fish…",
    timeAgo: "January 12, 2019",
  },
  { id: 2, image: b2, title: "The Amazing Hubble", timeAgo: "02 hours ago" },
  {
    id: 3,
    image: b3,
    title: "Astronomy Or Astrology",
    timeAgo: "03 hours ago",
  },
  { id: 4, image: b1, title: "Asteroids telescope", timeAgo: "01 hour ago" },
];

const RecentBlog = () => (
  <div className="mb-8">
    <h4 className="text-lg font-semibold mb-3">Recent Post</h4>
    {posts.map((p) => (
      <RecentBlogItem key={p.id} {...p} />
    ))}
  </div>
);

export default RecentBlog;
