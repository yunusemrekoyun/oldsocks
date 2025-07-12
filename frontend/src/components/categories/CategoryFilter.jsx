// src/components/CategoryFilter.jsx
import React from "react";
import { FaChevronDown } from "react-icons/fa";

const filters = ["Category", "Type", "Size", "Color", "Price range"];

const CategoryFilter = () => (
  <div className="space-y-4">
    {filters.map((label) => (
      <div
        key={label}
        className="flex justify-between items-center border border-gray-200 rounded-lg px-4 py-3 cursor-pointer hover:bg-gray-50 transition"
      >
        <span className="text-gray-800">{label}</span>
        <FaChevronDown className="text-gray-500" />
      </div>
    ))}
  </div>
);

export default CategoryFilter;
