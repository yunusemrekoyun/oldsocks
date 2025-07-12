// src/components/BlogCommentInput.jsx
import React from "react";
import ContactInput from "../contact/ContactInput";

const BlogCommentInput = () => (
  <div className="mt-12">
    <h4 className="text-lg font-semibold mb-6">Leave a Reply</h4>
    <form className="space-y-6">
      <ContactInput multiline placeholder="Write Comment" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ContactInput placeholder="Name" />
        <ContactInput placeholder="Email" />
        <ContactInput placeholder="Website" />
      </div>
      <button className="px-8 py-3 border border-purple-600 text-purple-600 rounded hover:bg-purple-600 hover:text-white transition">
        Post Comment
      </button>
    </form>
  </div>
);

export default BlogCommentInput;
