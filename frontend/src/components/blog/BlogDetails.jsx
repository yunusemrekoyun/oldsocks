// src/components/blog/BlogDetails.jsx
import React from "react";
import {
  FaUserAlt,
  FaFolderOpen,
  FaComments,
  FaFacebookF,
  FaTwitter,
  FaPinterestP,
} from "react-icons/fa";

export default function BlogDetails({
  image,
  date,
  title,
  author,
  category,
  comments,
  paragraphs,
  quote,
}) {
  return (
    <article className="mb-12">
      <div className="relative rounded-lg overflow-hidden shadow-lg">
        <img src={image} alt={title} className="w-full object-cover" />
        <div className="absolute top-4 left-4 bg-[#03588C] text-white text-sm font-semibold px-3 py-1 rounded">
          {date}
        </div>
      </div>

      <h1 className="mt-6 text-3xl font-serif font-bold text-[#0b0b0d]">
        {title}
      </h1>

      <div className="flex items-center space-x-6 text-[#666] text-sm mt-2">
        <span className="flex items-center">
          <FaUserAlt className="mr-1" /> {author}
        </span>
        <span className="flex items-center">
          <FaFolderOpen className="mr-1" /> {category}
        </span>
        <span className="flex items-center">
          <FaComments className="mr-1" /> {comments} Yorumlar
        </span>
      </div>

      <div className="text-lg max-w-full break-words text-[#444] mt-6 leading-relaxed">
        {paragraphs.map((p, i) => (
          <p key={i} className="mb-4">
            {p}
          </p>
        ))}
      </div>

      {quote && (
        <blockquote className="border-l-4 border-[#03588C] italic pl-6 my-8 text-[#444]">
          {quote}
        </blockquote>
      )}


    </article>
  );
}
