// src/components/TagItem.jsx
import React from "react";
import PropTypes from "prop-types";

const TagItem = ({ tag }) => (
  <button className="text-sm text-gray-600 border border-gray-200 px-3 py-1 rounded-full mr-2 mb-2 hover:bg-purple-100 transition">
    {tag}
  </button>
);

TagItem.propTypes = {
  tag: PropTypes.string.isRequired,
};

export default TagItem;
