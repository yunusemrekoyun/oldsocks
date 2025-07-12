import React from "react";
import ContactInput from "../contact/ContactInput";

const BlogCommentInput = () => (
  <div className="mt-12">
    <h4 className="text-lg font-semibold text-[#0b0b0d] mb-6">Leave a Reply</h4>
    <form className="space-y-6">
      <ContactInput multiline placeholder="Write Comment" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ContactInput placeholder="Name" />
        <ContactInput placeholder="Email" />
        <ContactInput placeholder="Website" />
      </div>
      <button className="px-8 py-3 border border-[#03588C] text-[#03588C] rounded hover:bg-[#03588C] hover:text-white transition-colors duration-200">
        Post Comment
      </button>
    </form>
  </div>
);

export default BlogCommentInput;
