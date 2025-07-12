import React from "react";

const BlogPagination = () => (
  <div className="flex justify-center items-center mt-8 space-x-4">
    <button className="px-3 py-1 border border-light2 rounded hover:bg-light1">
      &lt;
    </button>
    <button className="px-3 py-1 border border-dark1 text-dark1 rounded">
      1
    </button>
    <button className="px-3 py-1 border border-light2 rounded hover:bg-light1">
      2
    </button>
    <button className="px-3 py-1 border border-light2 rounded hover:bg-light1">
      &gt;
    </button>
  </div>
);

export default BlogPagination;
