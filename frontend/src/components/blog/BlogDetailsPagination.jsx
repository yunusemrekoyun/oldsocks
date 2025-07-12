// src/components/BlogDetailsPagination.jsx
import React from "react";
import { Link } from "react-router-dom";
import prevImg from "../../assets/blog/blog-pagination/next.png";
import nextImg from "../../assets/blog/blog-pagination/previous.png";

const BlogDetailsPagination = () => (
  <div className="flex justify-between items-center py-8 border-t border-gray-200">
    {/* Previous */}
    <Link
      to="/blog/prev"
      className="flex items-center space-x-4 hover:text-purple-600 transition"
    >
      <img
        src={prevImg}
        alt="Previous Post"
        className="w-16 h-16 object-cover rounded"
      />
      <div>
        <p className="text-sm text-gray-500">Prev Post</p>
        <h4 className="font-medium">Space The Final Frontier</h4>
      </div>
    </Link>
    {/* Next */}
    <Link
      to="/blog/next"
      className="flex items-center space-x-4 hover:text-purple-600 transition"
    >
      <div className="text-right">
        <p className="text-sm text-gray-500">Next Post</p>
        <h4 className="font-medium">Telescopes 101</h4>
      </div>
      <img
        src={nextImg}
        alt="Next Post"
        className="w-16 h-16 object-cover rounded"
      />
    </Link>
  </div>
);

export default BlogDetailsPagination;
