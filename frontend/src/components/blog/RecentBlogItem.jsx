// src/components/RecentBlogItem.jsx
import React from "react";
import PropTypes from "prop-types";

const RecentBlogItem = ({ image, title, timeAgo }) => (
  <div className="flex items-center mb-4">
    <img
      src={image}
      alt={title}
      className="w-16 h-16 object-cover rounded mr-4"
    />
    <div>
      <p className="text-sm font-medium hover:text-purple-600 transition">
        {title}
      </p>
      <p className="text-xs text-gray-500">{timeAgo}</p>
    </div>
  </div>
);

RecentBlogItem.propTypes = {
  image: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  timeAgo: PropTypes.string.isRequired,
};

export default RecentBlogItem;
