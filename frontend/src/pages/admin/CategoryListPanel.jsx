// src/components/admin/CategoryListPanel.jsx
import React from "react";
import { FaEllipsisV } from "react-icons/fa";
import api from "../../../api";

export default function CategoryListPanel({
  categories,
  onEdit,
  onDelete,
  isFull,
}) {
  const handleDelete = async (id) => {
    if (!confirm("Bu kategoriyi silmek istediğine emin misin?")) return;
    try {
      await api.delete(`/categories/${id}`);
      onDelete();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className={`grid ${isFull ? "grid-cols-4" : "grid-cols-2"} gap-4`}>
      {categories.map((c) => (
        <div key={c._id} className="border rounded p-4 relative group bg-white">
          <img
            src={c.image}
            alt={c.name}
            className="w-full h-32 object-cover rounded"
          />
          <div className="mt-2 text-sm">
            <p className="font-medium">{c.name}</p>
            {c.parent && (
              <p className="text-gray-500 text-xs">
                Alt kategori: {c.parent.name}
              </p>
            )}
          </div>

          {/* 3 nokta butonu */}
          <button
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
            onClick={() => onEdit(c)}
          >
            <FaEllipsisV />
          </button>

          {/* Düzenle / Sil menüsü */}
          <div className="absolute top-8 right-2 hidden group-hover:block bg-white shadow rounded">
            <button
              onClick={() => onEdit(c)}
              className="block px-2 py-1 hover:bg-gray-100 text-left w-full"
            >
              Düzenle
            </button>
            <button
              onClick={() => handleDelete(c._id)}
              className="block px-2 py-1 hover:bg-gray-100 text-red-600 text-left w-full"
            >
              Sil
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
