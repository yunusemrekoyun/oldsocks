// src/components/CategoryItem.jsx
import React from "react";
import PropTypes from "prop-types";

const CategoryItem = ({ image, alt, onClick }) => (
  <div
    onClick={onClick}
    className="group overflow-hidden rounded-xl cursor-pointer border border-light3 bg-white shadow-md hover:shadow-lg transition-shadow duration-300"
  >
    <img
      src={image}
      alt={alt}
      className="w-full h-56 object-cover transform group-hover:scale-105 transition duration-300"
    />
  </div>
);

CategoryItem.propTypes = {
  image: PropTypes.string.isRequired,
  alt: PropTypes.string,
  onClick: PropTypes.func,
};

CategoryItem.defaultProps = {
  alt: "",
  onClick: () => {},
};

export default CategoryItem;
