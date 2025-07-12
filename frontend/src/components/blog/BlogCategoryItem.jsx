import React from "react";
import PropTypes from "prop-types";

const BlogCategoryItem = ({ name, count }) => (
  <li className="flex justify-between items-center py-2 border-b border-[#eee] hover:text-[#0b0b0d] transition-colors">
    <span>{name}</span>
    <span className="text-sm text-[#5f5f5f]">({count})</span>
  </li>
);

BlogCategoryItem.propTypes = {
  name: PropTypes.string.isRequired,
  count: PropTypes.number.isRequired,
};

export default BlogCategoryItem;
