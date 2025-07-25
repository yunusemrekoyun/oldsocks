// src/components/blog/BlogCommentInput.jsx
import React, { useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import api from "../../../api";

export default function BlogCommentInput({ blogId, onCommentPosted }) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      // Eski: /blogs/${blogId}/comments
      // Yeni route:
      await api.post(`/comments/blogs/${blogId}/comments`, { text });
      setText("");
      onCommentPosted();
    } catch (err) {
      console.error("Yorum gönderilemedi:", err);
      alert("Yorum gönderilirken hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-12">
      <h4 className="text-lg font-semibold text-[#0b0b0d] mb-6">
        Leave a Reply
      </h4>
      <form onSubmit={handleSubmit} className="space-y-6">
        <TextareaAutosize
          minRows={4}
          placeholder="Write Comment"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full border px-3 py-2 rounded resize-none"
        />
        <button
          type="submit"
          disabled={submitting}
          className={`px-8 py-3 border rounded ${
            submitting
              ? "bg-gray-300 border-gray-300 text-gray-600"
              : "border-[#03588C] text-[#03588C] hover:bg-[#03588C] hover:text-white"
          } transition-colors duration-200`}
        >
          {submitting ? "Posting…" : "Post Comment"}
        </button>
      </form>
    </div>
  );
}
