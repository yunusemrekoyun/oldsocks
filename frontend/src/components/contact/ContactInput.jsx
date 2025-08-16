// src/components/contact/ContactInput.jsx
import React from "react";
import PropTypes from "prop-types";

const ContactInput = ({
  multiline,
  placeholder,
  className,
  name,
  value,
  onChange,
  required,
  disabled,
  type,
  rows,
  ...rest
}) => {
  const baseStyles =
    "w-full border border-light2 text-dark2 bg-white placeholder-dark2 rounded-lg px-4 py-2 focus:outline-none focus:border-dark1";

  if (multiline) {
    return (
      <textarea
        name={name}
        placeholder={placeholder}
        className={`${baseStyles} h-40 ${className}`}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        rows={rows}
        {...rest}
      />
    );
  }

  return (
    <input
      name={name}
      type={type}
      placeholder={placeholder}
      className={`${baseStyles} ${className}`}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      {...rest}
    />
  );
};

ContactInput.propTypes = {
  multiline: PropTypes.bool,
  placeholder: PropTypes.string.isRequired,
  className: PropTypes.string,
  name: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  type: PropTypes.string,
  rows: PropTypes.number,
};

ContactInput.defaultProps = {
  multiline: false,
  className: "",
  name: undefined,
  value: undefined,
  onChange: undefined,
  required: false,
  disabled: false,
  type: "text",
  rows: 8,
};

export default ContactInput;
