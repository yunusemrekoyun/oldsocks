/* Updated src/components/blog/CommentReplyForm.jsx */
import React, { useState } from "react";
import api from "../../../api";

export default function CommentReplyForm({ commentId, onReplyPosted }) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);

    try {
      await api.post(`/comments/${commentId}/replies`, { text });
      setText("");
      // Toast’ı parent göstersin:
      onReplyPosted?.({
        ok: true,
        msg: "Yanıtınız alındı ve onaylandıktan sonra yayınlanacaktır.",
      });
    } catch (err) {
      console.error("Reply gönderilemedi:", err);
      onReplyPosted?.({
        ok: false,
        msg: "Yanıt gönderilirken hata oluştu.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-2">
      <textarea
        rows={3}
        placeholder="Bir cevap yazın..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full border px-3 py-2 rounded resize-none"
        disabled={submitting}
      />
      <button
        type="submit"
        disabled={submitting}
        className={`px-4 py-2 text-sm rounded ${
          submitting
            ? "bg-gray-300 text-gray-600"
            : "bg-green-600 text-white hover:bg-green-700"
        }`}
      >
        {submitting ? "Gönderiliyor..." : "Yanıtı Gönder"}
      </button>
    </form>
  );
}
