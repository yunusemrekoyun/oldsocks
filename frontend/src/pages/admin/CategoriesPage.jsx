// src/pages/admin/CategoriesPage.jsx
import React, { useState, useEffect } from "react";
import Window from "../../components/ui/Window";
import CategoryListPanel from "./CategoryListPanel";
import CategoryFormModal from "./CategoryFormModal";
import api from "../../../api";

export default function CategoriesPage() {
  const [cats, setCats] = useState([]);
  const [activeCat, setActiveCat] = useState(null);
  const [showList, setShowList] = useState(false);
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
    <div className="p-6 space-y-4">
      <div className="flex gap-4">
        <button
          onClick={openNew}
          className="px-4 py-2 bg-blue-100 rounded hover:bg-blue-200"
        >
          Kategori Ekle
        </button>
        <button
          onClick={() => setShowList((f) => !f)}
          className="px-4 py-2 bg-green-100 rounded hover:bg-green-200"
        >
          {showList ? "Listeyi Gizle" : "Kategori Listesi"}
        </button>
      </div>

      {showList && (
        <Window title="Kategori Listesi" onClose={() => setShowList(false)}>
          <CategoryListPanel
            categories={cats}
            onEdit={openEdit}
            onDelete={fetchCats}
            isFull
          />
        </Window>
      )}

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
