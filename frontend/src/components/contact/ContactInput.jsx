// src/components/ContactInput.jsx
import React from "react";
import PropTypes from "prop-types";

const ContactInput = ({ multiline, placeholder, className }) => {
  const baseStyles =
    "w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none";
  if (multiline) {
    return (
      <textarea
        placeholder={placeholder}
        className={`${baseStyles} h-40 ${className}`}
      />
    );
  }
  return (
    <input
      type="text"
      placeholder={placeholder}
      className={`${baseStyles} ${className}`}
    />
  );
};

ContactInput.propTypes = {
  multiline: PropTypes.bool,
  placeholder: PropTypes.string.isRequired,
  className: PropTypes.string,
};

ContactInput.defaultProps = {
  multiline: false,
  className: "",
};

export default ContactInput;
