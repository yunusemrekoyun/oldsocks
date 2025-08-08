// src/pages/admin/CategoriesPage.jsx
import React, { useState, useEffect } from "react";
import CategoryListPanel from "../panels/CategoryListPanel";
import CategoryFormModal from "../modals/CategoryFormModal";
import api from "../../../api";
import Window from "../../components/ui/Window";

export default function CategoriesPage() {
  const [cats, setCats] = useState([]);
  const [activeCat, setActiveCat] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const fetchCats = async () => {
    const { data } = await api.get("/categories");
    setCats(data);
  };

  useEffect(() => {
    fetchCats();
  }, []);

  const openNew = () => {
    setActiveCat(null);
    setShowForm(true);
  };

  const openEdit = (c) => {
    setActiveCat(c);
    setShowForm(true);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-dark1">Kategoriler</h1>
        <button
          onClick={openNew}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow"
        >
          + Yeni Kategori
        </button>
      </div>

      {/* Kategori Kartları */}
      <CategoryListPanel
        categories={cats}
        onEdit={openEdit}
        onDelete={fetchCats}
        isFull
      />

      {/* Form Modal */}
      {showForm && (
        <Window
          title={activeCat ? "Kategori Düzenle" : "Yeni Kategori"}
          onClose={() => setShowForm(false)}
        >
          <CategoryFormModal
            category={activeCat}
            onClose={() => setShowForm(false)}
            onSaved={() => {
              fetchCats();
              setShowForm(false);
            }}
          />
        </Window>
      )}
    </div>
  );
}
