// src/components/CategoryFilter.jsx
import React from "react";
import { FaChevronDown } from "react-icons/fa";

const filters = ["Category", "Type", "Size", "Color", "Price range"];

const CategoryFilter = () => (
  <div className="space-y-4">
    {filters.map((label) => (
      <div
        key={label}
        className="flex justify-between items-center bg-light2  rounded-xl px-4 py-3 cursor-pointer hover:bg-dark2/5 transition"
      >
        <span className="text-dark1 font-medium tracking-wide">{label}</span>
        <FaChevronDown className="text-dark2" />
      </div>
    ))}
  </div>
);

export default CategoryFilter;
