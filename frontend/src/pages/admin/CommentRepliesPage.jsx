// src/pages/admin/CommentRepliesPage.jsx
import React, { useCallback, useEffect, useState } from "react";
import api from "../../../api";
import { Button, IconButton } from "@material-tailwind/react";
import { TrashIcon, CheckIcon } from "@heroicons/react/24/outline";
import ToastAlert from "../../components/ui/ToastAlert"; // ← yolu kontrol edin

/* ───────── Silme Onay Modali ───────── */
const ConfirmModal = ({ open, onClose, onConfirm, message }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-xl p-6 shadow max-w-sm w-full">
        <p className="mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <Button variant="text" onClick={onClose}>
            Vazgeç
          </Button>
          <Button color="red" onClick={onConfirm}>
            Sil
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function CommentRepliesPage() {
  const [filter, setFilter] = useState("approved"); // approved | pending
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(false);

  /* toast & sil onay */
  const [toast, setToast] = useState(null); // { msg, type }
  const [deleteId, setDeleteId] = useState(null);

  /* ───────── Yanıtları getir ───────── */
  const fetchReplies = useCallback(async () => {
    setLoading(true);
    try {
      const approved = filter === "approved";
      const { data } = await api.get(`/replies?approved=${approved}`);
      setReplies(data);
    } catch {
      setToast({ msg: "Yanıtlar yüklenemedi.", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchReplies();
  }, [fetchReplies]);

  /* ───────── Onayla ───────── */
  const handleApprove = async (id) => {
    try {
      await api.patch(`/replies/${id}/approve`);
      setToast({ msg: "Yanıt onaylandı.", type: "success" });
      fetchReplies();
    } catch {
      setToast({ msg: "Yanıt onaylanamadı.", type: "error" });
    }
  };

  /* ───────── Silme akışı ───────── */
  const triggerDelete = (id) => setDeleteId(id);

  const handleDeleteConfirmed = async () => {
    const id = deleteId;
    setDeleteId(null);
    try {
      await api.delete(`/replies/${id}`);
      setToast({ msg: "Yanıt silindi.", type: "success" });
      fetchReplies();
    } catch {
      setToast({ msg: "Yanıt silinemedi.", type: "error" });
    }
  };

  /* ───────── Render ───────── */
  return (
    <div>
      <h4 className="text-2xl mb-4">Yorum Yanıtlarını Yönet</h4>

      {/* Filtre butonları */}
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

      {/* Liste */}
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
                  onClick={() => triggerDelete(r._id)}
                >
                  <TrashIcon className="h-5 w-5" />
                </IconButton>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Silme onayı */}
      <ConfirmModal
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirmed}
        message="Bu yanıtı silmek istediğinize emin misiniz?"
      />

      {/* Toast */}
      {toast && (
        <ToastAlert
          msg={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
