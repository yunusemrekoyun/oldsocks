// src/pages/admin/CommentsPage.jsx
import React, { useEffect, useState } from "react";
import api from "../../../api";
import { Button, IconButton } from "@material-tailwind/react";
import { TrashIcon, CheckIcon } from "@heroicons/react/24/outline";

export default function CommentsPage() {
  const [filter, setFilter] = useState("approved"); // approved | pending
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const approved = filter === "approved";
      const { data } = await api.get(`/comments?approved=${approved}`);
      setComments(data);
    } catch (err) {
      console.error("Yorumlar yüklenemedi:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [filter]);

  const handleApprove = async (id) => {
    try {
      await api.patch(`/comments/${id}/approve`);
      fetchComments();
    } catch (err) {
      console.error("Yorum onaylanamadı:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Silmek istediğinize emin misiniz?")) return;
    try {
      await api.delete(`/comments/${id}`);
      fetchComments();
    } catch (err) {
      console.error("Yorum silinemedi:", err);
    }
  };

  return (
    <div>
      <h4 className="text-2xl mb-4">Yorum Yönetimi</h4>

      <div className="flex gap-4 mb-6">
        <Button
          size="sm"
          variant={filter === "approved" ? "filled" : "outlined"}
          onClick={() => setFilter("approved")}
        >
          Onaylanan
        </Button>
        <Button
          size="sm"
          variant={filter === "pending" ? "filled" : "outlined"}
          onClick={() => setFilter("pending")}
        >
          Onay Bekleyen
        </Button>
      </div>

      {loading ? (
        <div>Yükleniyor…</div>
      ) : (
        <ul className="space-y-4">
          {comments.map((c) => (
            <li
              key={c._id}
              className="p-4 bg-white rounded shadow flex justify-between items-start"
            >
              <div>
                <p className="font-medium">
                  {c.author.firstName} {c.author.lastName}
                </p>
                <p className="text-sm mt-1">{c.text}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(c.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                {filter === "pending" && (
                  <IconButton
                    variant="text"
                    color="green"
                    onClick={() => handleApprove(c._id)}
                  >
                    <CheckIcon className="h-5 w-5" />
                  </IconButton>
                )}
                <IconButton
                  variant="text"
                  color="red"
                  onClick={() => handleDelete(c._id)}
                >
                  <TrashIcon className="h-5 w-5" />
                </IconButton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
