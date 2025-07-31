// src/components/admin/CategoryListPanel.jsx
import React, { useState } from "react";
import { FaEllipsisV } from "react-icons/fa";
import api from "../../../api";
import ToastAlert from "../../components/ui/ToastAlert";

/* ───────── Silme Onay Modali ───────── */
const ConfirmModal = ({ open, onClose, onConfirm, message }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-xl p-6 shadow max-w-sm w-full">
        <p className="mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded border hover:bg-gray-100"
          >
            Vazgeç
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
          >
            Sil
          </button>
        </div>
      </div>
    </div>
  );
};

export default function CategoryListPanel({
  categories,
  onEdit,
  onDelete,
  isFull,
}) {
  /* toast & sil onay */
  const [toast, setToast] = useState(null); // { msg, type }
  const [deleteId, setDeleteId] = useState(null);

  /* ───────── Silme akışı ───────── */
  const triggerDelete = (id) => setDeleteId(id);

  const handleDeleteConfirmed = async () => {
    const id = deleteId;
    setDeleteId(null);
    try {
      await api.delete(`/categories/${id}`);
      setToast({ msg: "Kategori silindi.", type: "success" });
      onDelete(); // parent’ı bilgilendir
    } catch {
      setToast({ msg: "Kategori silinemedi.", type: "error" });
    }
  };

  /* ───────── renderItem ───────── */
  const renderItem = (c) => (
    <div key={c._id} className="border rounded p-4 relative group bg-white">
      <img
        src={c.image}
        alt={c.name}
        className="w-full h-32 object-cover rounded"
      />

      <div className="mt-2">
        <p className="font-medium">{c.name}</p>
        {c.parent && (
          <p className="text-gray-500 text-xs">Üst: {c.parent.name}</p>
        )}
        {c.children?.length > 0 && (
          <p className="text-gray-500 text-xs mt-1">
            Alt Kategori: {c.children.map((ch) => ch.name).join(", ")}
          </p>
        )}
      </div>

      {/* 3 nokta menü */}
      <button
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
        onClick={() => onEdit(c)}
      >
        <FaEllipsisV />
      </button>
      <div className="absolute top-8 right-2 hidden group-hover:block bg-white shadow rounded">
        <button
          onClick={() => onEdit(c)}
          className="block px-2 py-1 hover:bg-gray-100 w-full text-left"
        >
          Düzenle
        </button>
        <button
          onClick={() => triggerDelete(c._id)}
          className="block px-2 py-1 hover:bg-gray-100 w-full text-left text-red-600"
        >
          Sil
        </button>
      </div>
    </div>
  );

  /* ───────── JSX ───────── */
  return (
    <>
      <div className={`grid ${isFull ? "grid-cols-4" : "grid-cols-2"} gap-4`}>
        {categories.map(renderItem)}
      </div>

      {/* Silme onayı */}
      <ConfirmModal
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirmed}
        message="Bu kategoriyi silmek istediğinize emin misin?"
      />

      {/* Toast */}
      {toast && (
        <ToastAlert
          msg={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
