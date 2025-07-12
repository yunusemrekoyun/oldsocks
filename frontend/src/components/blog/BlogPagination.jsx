// src/components/BlogPagination.jsx
import React from "react";

const BlogPagination = () => (
  <div className="flex justify-center items-center mt-8 space-x-4">
    <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100">
      &lt;
    </button>
    <button className="px-3 py-1 border border-purple-600 text-purple-600 rounded">
      1
    </button>
    <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100">
      2
    </button>
    <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100">
      &gt;
    </button>
  </div>
);

export default BlogPagination;
