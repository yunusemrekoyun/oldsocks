// src/components/BlogCategoryItem.jsx
import React from "react";
import PropTypes from "prop-types";

const BlogCategoryItem = ({ name, count }) => (
  <li className="flex justify-between items-center py-2 border-b border-gray-100 hover:text-purple-600 transition">
    <span>{name}</span>
    <span className="text-sm text-gray-400">({count})</span>
  </li>
);

BlogCategoryItem.propTypes = {
  name: PropTypes.string.isRequired,
  count: PropTypes.number.isRequired,
};

export default BlogCategoryItem;
