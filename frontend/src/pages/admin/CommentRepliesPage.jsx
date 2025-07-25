// src/pages/admin/CommentRepliesPage.jsx
import React, { useEffect, useState } from "react";
import api from "../../../api";
import { Button, IconButton } from "@material-tailwind/react";
import { TrashIcon, CheckIcon } from "@heroicons/react/24/outline";

export default function CommentRepliesPage() {
  const [filter, setFilter] = useState("approved"); // approved | pending
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReplies = async () => {
    setLoading(true);
    try {
      const approved = filter === "approved";
      const { data } = await api.get(`/replies?approved=${approved}`);
      setReplies(data);
    } catch (err) {
      console.error("Yanıtlar yüklenemedi:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReplies();
  }, [filter]);

  const handleApprove = async (id) => {
    try {
      await api.patch(`/replies/${id}/approve`);
      fetchReplies();
    } catch (err) {
      console.error("Yanıt onaylanamadı:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Silmek istediğinize emin misiniz?")) return;
    try {
      await api.delete(`/replies/${id}`);
      fetchReplies();
    } catch (err) {
      console.error("Yanıt silinemedi:", err);
    }
  };

  return (
    <div>
      <h4 className="text-2xl mb-4">Yorum Yanıtlarını Yönet</h4>

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
          {replies.map((r) => (
            <li
              key={r._id}
              className="p-4 bg-white rounded shadow flex justify-between items-start"
            >
              <div>
                <p className="font-medium">
                  {r.author.firstName} {r.author.lastName}
                </p>
                <p className="text-sm mt-1">{r.text}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(r.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                {filter === "pending" && (
                  <IconButton
                    variant="text"
                    color="green"
                    onClick={() => handleApprove(r._id)}
                  >
                    <CheckIcon className="h-5 w-5" />
                  </IconButton>
                )}
                <IconButton
                  variant="text"
                  color="red"
                  onClick={() => handleDelete(r._id)}
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
