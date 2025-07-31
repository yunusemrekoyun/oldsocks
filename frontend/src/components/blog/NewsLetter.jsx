import React from "react";

const NewsLetter = () => (
  <div className="bg-[#f4f4f4] p-6 rounded-lg shadow-sm text-center">
    <h4 className="text-xl font-[Playfair] tracking-wide text-[#0b0b0d] mb-6 border-b border-[#d9d9d9] pb-3">
      Newsletter
    </h4>
    <form className="space-y-4">
      <input
        type="email"
        placeholder="Enter your email"
        className="w-full px-5 py-4 border border-[#d9d9d9] bg-white text-[#333] text-base rounded focus:outline-none focus:ring-2 focus:ring-[#125795] placeholder-gray-500"
      />
      <button
        type="submit"
        className="w-full py-4 bg-dark2 text-white text-sm font-medium uppercase tracking-wider rounded hover:bg-[#0b0b0d] transition"
      >
        Subscribe
      </button>
    </form>
  </div>
);

export default NewsLetter;
