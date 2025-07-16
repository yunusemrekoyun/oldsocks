// src/components/admin/CategoryFormModal.jsx
import React, { useState, useEffect } from "react";
import api from "../../../api";

export default function CategoryFormModal({ category, onClose, onSaved }) {
  const isEdit = Boolean(category);
  const [form, setForm] = useState({
    name: "",
    image: null,
    parent: "",
  });
  const [allCats, setAllCats] = useState([]);

  useEffect(() => {
    api.get("/categories").then((res) => setAllCats(res.data));
    if (category) {
      setForm({
        name: category.name,
        image: null,
        parent: category.parent?._id || "",
      });
    }
  }, [category]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image" && files) {
      setForm((f) => ({ ...f, image: files[0] }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("name", form.name);
    if (form.image) fd.append("image", form.image);
    if (form.parent) fd.append("parent", form.parent);

    try {
      if (isEdit) {
        await api.put(`/categories/${category._id}`, fd, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });
      } else {
        await api.post("/categories", fd, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });
      }
      onSaved();
    } catch (err) {
      console.error("Kategori kaydı hatası:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-30 flex items-center justify-center">
      <div className="bg-white w-3/4 max-w-md p-6 rounded shadow-lg relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
        >
          ✕
        </button>
        <h2 className="text-xl mb-4">
          {isEdit ? "Kategori Düzenle" : "Yeni Kategori"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label>İsim</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full border px-2 py-1 rounded"
            />
          </div>

          <div>
            <label>Görsel</label>
            <input
              type="file"
              name="image"
              accept="image/*"
              onChange={handleChange}
              className="w-full"
              required={!isEdit}
            />

            {/* 🖼 Mevcut görseli göster (edit modunda ve yeni görsel seçilmemişse) */}
            {isEdit && !form.image && category?.image && (
              <div className="mt-2">
                <label className="block mb-1 text-sm font-medium">
                  Mevcut Görsel:
                </label>
                <img
                  src={category.image}
                  alt="Kategori Görseli"
                  className="w-32 h-32 object-contain border rounded"
                />
              </div>
            )}
          </div>

          <div>
            <label>Üst Kategori (Opsiyonel)</label>
            <select
              name="parent"
              value={form.parent}
              onChange={handleChange}
              className="w-full border px-2 py-1 rounded"
            >
              <option value="">Yok</option>
              {allCats
                .filter((c) => !category || c._id !== category._id)
                .map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>

          <button
            type="submit"
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {isEdit ? "Güncelle" : "Ekle"}
          </button>
        </form>
      </div>
    </div>
  );
}
