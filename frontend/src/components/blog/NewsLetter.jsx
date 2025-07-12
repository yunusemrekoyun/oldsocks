// src/components/NewsLetter.jsx
import React from "react";

const NewsLetter = () => (
  <div className="bg-[#fcfaff] p-6 text-center">
    <h4 className="text-2xl font-[Playfair] tracking-wide text-black mb-6 border-b border-purple-100 pb-3">
      Newsletter
    </h4>
    <form className="space-y-5">
      <input
        type="email"
        placeholder="Enter email"
        className="w-full px-6 py-5 border border-purple-100 bg-white text-gray-500 text-lg font-light placeholder-gray-400 focus:outline-none"
      />
      <button
        type="submit"
        className="w-full py-5 border border-purple-500 text-purple-500 text-xl tracking-widest font-light uppercase hover:bg-purple-50 transition"
      >
        Subscribe
      </button>
    </form>
  </div>
);

export default NewsLetter;
