// src/components/blog/BlogCommentItem.jsx
import React from "react";
import placeholderAvatar from "../../assets/blog/blog-owner/author.png";

export default function BlogCommentItem({ comment }) {
  const { author, createdAt, text } = comment;
  const date = new Date(createdAt).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Eğer author.avatar boş ya da undefined ise placeholderAvatar kullan
  const avatarUrl = author?.avatar || placeholderAvatar;

  return (
    <div className="flex space-x-4 mb-8">
      <img
        src={avatarUrl}
        alt={`${author.firstName} ${author.lastName}`}
        className="w-12 h-12 rounded-full object-cover"
      />
      <div className="flex-1">
        <div className="flex justify-between items-center">
          <h5 className="font-medium text-[#0b0b0d]">
            {author.firstName} {author.lastName}
          </h5>
          <span className="text-sm text-[#888]">{date}</span>
        </div>
        <p className="text-[#444] mt-2">{text}</p>
      </div>
    </div>
  );
}
