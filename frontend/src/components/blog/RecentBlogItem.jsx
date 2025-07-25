import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

export default function RecentBlogItem({ post }) {
  const { slug, coverImageUrl, title, createdAt } = post;
  const formattedDate = new Date(createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link
      to={`/blog/${slug}`}
      className="flex items-center mb-4 hover:bg-gray-50 p-2 rounded transition-colors"
    >
      <img
        src={coverImageUrl}
        alt={title}
        className="w-16 h-16 object-cover rounded mr-4"
      />
      <div>
        <p className="text-sm font-medium text-[#0b0b0d] hover:text-[#125795] transition-colors">
          {title}
        </p>
        <p className="text-xs text-[#5f5f5f]">{formattedDate}</p>
      </div>
    </Link>
  );
}

RecentBlogItem.propTypes = {
  post: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    coverImageUrl: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired,
  }).isRequired,
};
