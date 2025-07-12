import React from "react";
import PropTypes from "prop-types";

const TagItem = ({ tag }) => (
  <button className="text-sm text-[#0b0b0d] border border-[#e6e6e6] px-3 py-1 rounded-full mr-2 mb-2 hover:bg-[#e6e6e6] transition">
    {tag}
  </button>
);

TagItem.propTypes = {
  tag: PropTypes.string.isRequired,
};

export default TagItem;
