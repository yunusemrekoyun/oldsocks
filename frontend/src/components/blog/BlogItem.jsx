// src/components/BlogItem.jsx
import React from "react";
import PropTypes from "prop-types";
import { FaUserAlt, FaFolderOpen, FaComments } from "react-icons/fa";
import { Link } from "react-router-dom";

const BlogItem = ({
  image,
  date,
  title,
  excerpt,
  author,
  category,
  comments,
}) => (
  <article className="mb-10 bg-white rounded-lg overflow-hidden shadow">
    <div className="relative">
      <Link to="/blog-details">
        <img
          src={image}
          alt={title}
          className="w-full h-64 object-cover cursor-pointer transition-transform duration-300 hover:scale-105"
        />
      </Link>
      <div className="absolute top-4 left-4 bg-purple-600 text-white text-sm font-semibold px-3 py-1 rounded">
        {date}
      </div>
    </div>

    <div className="p-6">
      <Link to="/blog-details">
        <h3 className="text-2xl font-serif font-bold mb-2 hover:text-purple-600 transition cursor-pointer">
          {title}
        </h3>
      </Link>
      <p className="text-gray-600 mb-4">{excerpt}</p>
      <div className="flex items-center space-x-6 text-sm text-gray-500">
        <span className="flex items-center">
          <FaUserAlt className="mr-1" /> {author}
        </span>
        <span className="flex items-center">
          <FaFolderOpen className="mr-1" /> {category}
        </span>
        <span className="flex items-center">
          <FaComments className="mr-1" /> {comments} Comments
        </span>
      </div>
    </div>
  </article>
);

BlogItem.propTypes = {
  image: PropTypes.string.isRequired,
  date: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  excerpt: PropTypes.string.isRequired,
  author: PropTypes.string.isRequired,
  category: PropTypes.string.isRequired,
  comments: PropTypes.number.isRequired,
};

export default BlogItem;
