/* Updated src/components/blog/BlogCommentItem.jsx */
import React, { useState, useEffect } from "react";
import placeholderAvatar from "../../assets/blog/blog-owner/author.png";
import CommentReplyForm from "./CommentReplyForm";
import CommentReplies from "./CommentReplies";
import api from "../../../api";

export default function BlogCommentItem({ comment }) {
  const { author, createdAt, text, _id: commentId } = comment;
  const date = new Date(createdAt).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const avatarUrl = author?.avatar || placeholderAvatar;

  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchReplies = async () => {
    setLoadingReplies(true);
    try {
      const { data } = await api.get(`/comments/${commentId}/replies`);
      setReplies(data);
    } catch (err) {
      console.error("Yanıtlar yüklenemedi:", err);
    } finally {
      setLoadingReplies(false);
    }
  };

  useEffect(() => {
    if (showReplies) fetchReplies();
  }, [showReplies]);

  const handleReplyPosted = () => {
    setShowForm(false);
    fetchReplies();
    setShowReplies(true);
  };

  return (
    <div className="mb-8">
      <div className="flex space-x-4">
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

          {/* Actions */}
          <div className="mt-3 flex items-center gap-4 text-sm">
            <button
              onClick={() => setShowReplies((v) => !v)}
              className="text-blue-600 hover:underline"
            >
              {showReplies ? "Hide Replies" : "View Replies"}
            </button>
            <button
              onClick={() => setShowForm((v) => !v)}
              className="text-green-600 hover:underline"
            >
              {showForm ? "Cancel" : "Reply"}
            </button>
          </div>

          {/* Replies List */}
          {showReplies && (
            <CommentReplies replies={replies} loading={loadingReplies} />
          )}

          {/* Reply Form */}
          {showForm && (
            <CommentReplyForm
              commentId={commentId}
              onReplyPosted={handleReplyPosted}
            />
          )}
        </div>
      </div>
    </div>
  );
}
