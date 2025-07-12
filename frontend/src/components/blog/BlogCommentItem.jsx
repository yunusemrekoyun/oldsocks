// src/components/BlogCommentItem.jsx
import React from "react";

const BlogCommentItem = ({ avatar, name, date, text }) => (
  <div className="flex space-x-4 mb-8">
    <img
      src={avatar}
      alt={name}
      className="w-12 h-12 rounded-full object-cover"
    />
    <div className="flex-1">
      <div className="flex justify-between items-center">
        <h5 className="font-medium text-gray-900">{name}</h5>
        <span className="text-sm text-gray-400">{date}</span>
      </div>
      <p className="text-gray-700 mt-2">{text}</p>
      <button className="text-purple-600 text-sm mt-2 hover:underline">
        Reply
      </button>
    </div>
  </div>
);

export default BlogCommentItem;
