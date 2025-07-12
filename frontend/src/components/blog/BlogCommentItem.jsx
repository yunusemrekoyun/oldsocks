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
        <h5 className="font-medium text-[#0b0b0d]">{name}</h5>
        <span className="text-sm text-[#888]">{date}</span>
      </div>
      <p className="text-[#444] mt-2">{text}</p>
      <button className="text-sm mt-2 text-[#03588C] hover:underline transition-colors duration-200">
        Reply
      </button>
    </div>
  </div>
);

export default BlogCommentItem;
