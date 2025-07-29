import React from "react";
import PropTypes from "prop-types";

const CategoryItem = ({ image, alt, onClick }) => (
  <div
    onClick={onClick}
    className="group overflow-hidden rounded-xl cursor-pointer border border-light2 bg-white shadow hover:shadow-lg transition duration-300 flex flex-col"
  >
    {/* Görsel */}
    <div className="h-72 w-full overflow-hidden">
      <img
        src={image}
        alt={alt}
        className="w-full h-full object-cover transform group-hover:scale-105 transition duration-300"
      />
    </div>

    {/* Başlık */}
    <div className="py-3 px-4 text-center bg-light1">
      <h3 className="text-dark1 font-semibold text-sm uppercase tracking-wide group-hover:underline">
        {alt}
      </h3>
    </div>
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