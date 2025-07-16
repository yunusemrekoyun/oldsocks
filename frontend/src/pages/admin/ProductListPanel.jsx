// src/components/admin/ProductListPanel.jsx
import React from "react";
import { FaEllipsisV } from "react-icons/fa";
import api from "../../../api";

export default function ProductListPanel({
  products,
  onEdit,
  onDelete,
  isFull,
}) {
  const handleDelete = async (id) => {
    if (!confirm("Silmek istediğine emin misin?")) return;
    try {
      await api.delete(`/products/${id}`);
      onDelete();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className={`grid ${isFull ? "grid-cols-4" : "grid-cols-2"} gap-4`}>
      {products.map((p) => (
        <div key={p._id} className="border rounded p-2 relative group">
          <img
            src={p.images[0]}
            alt=""
            className="w-full h-32 object-cover rounded"
          />
          <div className="mt-2 text-sm">
            <p>{p.price}₺</p>
            <p className="text-gray-500">{p.category.name}</p>
          </div>
          <button
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
            onClick={() => onEdit(p)}
          >
            <FaEllipsisV />
          </button>
          <div className="absolute top-8 right-2 hidden group-hover:block bg-white shadow rounded">
            <button
              onClick={() => onEdit(p)}
              className="block px-2 py-1 hover:bg-gray-100"
            >
              Düzenle
            </button>
            <button
              onClick={() => handleDelete(p._id)}
              className="block px-2 py-1 text-red-600 hover:bg-gray-100"
            >
              Sil
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
