// src/components/BlogSearch.jsx
import React from "react";
import { FaSearch } from "react-icons/fa";

const BlogSearch = () => (
  <div className="mb-8">
    <h4 className="text-lg font-semibold mb-3">Search Keyword</h4>
    <div className="flex">
      <input
        type="text"
        placeholder="Search..."
        className="w-full border border-gray-200 rounded-l-lg px-4 py-2 focus:outline-none"
      />
      <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 rounded-r-lg transition">
        <FaSearch />
      </button>
    </div>
  </div>
);

export default BlogSearch;
