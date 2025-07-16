// src/pages/admin/CategoriesPage.jsx
import React, { useState, useEffect } from "react";
import Window from "../../components/ui/Window";
import CategoryListPanel from "./CategoryListPanel";
import CategoryFormModal from "./CategoryFormModal";
import api from "../../../api";

export default function CategoriesPage() {
  const [cats, setCats] = useState([]);
  const [activeCat, setActiveCat] = useState(null);
  const [showListFull, setShowListFull] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchCats = async () => {
    try {
      const { data } = await api.get("/categories");
      setCats(data);
    } catch (e) {
      console.error(e);
    }
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
  const closeForm = () => setShowForm(false);

  return (
    <div className="p-6 space-y-4">
      <div className="flex space-x-4">
        <h1
          onClick={openNew}
          className="cursor-pointer text-lg font-semibold px-4 py-2 bg-blue-100 rounded hover:bg-blue-200"
        >
          Kategori Ekle
        </h1>
        <h1
          onClick={() => setShowListFull((f) => !f)}
          className="cursor-pointer text-lg font-semibold px-4 py-2 bg-green-100 rounded hover:bg-green-200"
        >
          {showListFull ? "Listeyi Küçült" : "Kategori Listesi"}
        </h1>
      </div>

      {showListFull ? (
        <Window title="Kategori Listesi" onClose={() => setShowListFull(false)}>
          <CategoryListPanel
            categories={cats}
            onEdit={openEdit}
            onDelete={fetchCats}
            isFull={true}
          />
        </Window>
      ) : (
        <CategoryListPanel
          categories={cats}
          onEdit={openEdit}
          onDelete={fetchCats}
          isFull={false}
        />
      )}

      {showForm && (
        <Window
          title={activeCat ? "Kategori Düzenle" : "Yeni Kategori"}
          onClose={closeForm}
        >
          <CategoryFormModal
            category={activeCat}
            onClose={closeForm}
            onSaved={() => {
              fetchCats();
              closeForm();
            }}
          />
        </Window>
      )}
    </div>
  );
}
