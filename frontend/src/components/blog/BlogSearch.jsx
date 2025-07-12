import React from "react";
import { FaSearch } from "react-icons/fa";

const BlogSearch = () => (
  <div className="mb-8">
    <h4 className="text-lg font-semibold mb-3 text-[#0b0b0d]">
      Search Keyword
    </h4>
    <div className="flex">
      <input
        type="text"
        placeholder="Search..."
        className="w-full border border-[#ddd] rounded-l-lg px-4 py-2 focus:outline-none text-[#444] placeholder-[#888]"
      />
      <button className="bg-[#0b0b0d] hover:bg-[#444] text-white px-4 rounded-r-lg transition-colors">
        <FaSearch />
      </button>
    </div>
  </div>
);

export default BlogSearch;
