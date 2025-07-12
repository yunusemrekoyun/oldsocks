// src/components/SocialMediaItem.jsx
import React from "react";
import PropTypes from "prop-types";

function SocialMediaItem(props) {
  const { icon: Icon, link } = props;

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded-full hover:border-purple-600 transition"
    >
      <Icon className="text-gray-600 hover:text-purple-600 text-sm" />
    </a>
  );
}

SocialMediaItem.propTypes = {
  icon: PropTypes.elementType.isRequired,
  link: PropTypes.string.isRequired,
};

export default SocialMediaItem;
