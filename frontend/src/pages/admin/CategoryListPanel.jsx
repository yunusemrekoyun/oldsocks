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

  // Her kategori altında varsa children’ı da listeleriz
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

      {/* 3 nokta */}
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
          onClick={() => handleDelete(c._id)}
          className="block px-2 py-1 hover:bg-gray-100 w-full text-left text-red-600"
        >
          Sil
        </button>
      </div>
    </div>
  );

  return (
    <div className={`grid ${isFull ? "grid-cols-4" : "grid-cols-2"} gap-4`}>
      {categories.map(renderItem)}
    </div>
  );
}
