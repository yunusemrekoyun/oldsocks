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
      <p className="text-sm font-medium text-[#0b0b0d] hover:text-[#125795] transition-colors cursor-pointer">
        {title}
      </p>
      <p className="text-xs text-[#5f5f5f]">{timeAgo}</p>
    </div>
  </div>
);

RecentBlogItem.propTypes = {
  image: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  timeAgo: PropTypes.string.isRequired,
};

export default RecentBlogItem;
