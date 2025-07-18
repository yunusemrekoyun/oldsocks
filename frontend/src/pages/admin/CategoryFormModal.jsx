// src/components/admin/CategoryFormModal.jsx
import React, { useState, useEffect } from "react";
import api from "../../../api";

export default function CategoryFormModal({ category, onClose, onSaved }) {
  const isEdit = Boolean(category);
  const [form, setForm] = useState({ name: "", image: null });
  const [childrenInput, setChildrenInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Kategori listesini çekmeye artık gerek yok (parent seçimi kalktı)
  useEffect(() => {
    if (isEdit) {
      setForm({ name: category.name, image: null });
      setChildrenInput((category.children || []).map((c) => c.name).join(", "));
    } else {
      setForm({ name: "", image: null });
      setChildrenInput("");
    }
  }, [category, isEdit]);

  const handleChange = (e) => {
    const { name, files, value } = e.target;
    if (name === "image" && files.length) {
      setForm((f) => ({ ...f, image: files[0] }));
    } else if (name === "children") {
      setChildrenInput(value);
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData();
    fd.append("name", form.name);
    if (form.image) fd.append("image", form.image);
    if (childrenInput.trim()) fd.append("children", childrenInput);

    try {
      if (isEdit) {
        await api.put(`/categories/${category._id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post("/categories", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      onSaved();
    } catch (err) {
      console.error("Kategori kaydı hatası:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 1) Kategori adı */}
      <div>
        <label className="block mb-1">Kategori Adı</label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          className="w-full border px-2 py-1 rounded"
        />
      </div>

      {/* 2) Görsel */}
      <div>
        <label className="block mb-1">Görsel</label>
        <input
          type="file"
          name="image"
          accept="image/*"
          onChange={handleChange}
          className="w-full"
          required={!isEdit}
        />
        {isEdit && !form.image && category.image && (
          <img
            src={category.image}
            alt="Mevcut"
            className="mt-2 w-24 h-24 object-contain border rounded"
          />
        )}
      </div>

      {/* 3) Alt kategoriler */}
      <div>
        <label className="block mb-1">Alt Kategoriler (virgülle ayır)</label>
        <input
          name="children"
          value={childrenInput}
          onChange={handleChange}
          placeholder="Örn: Oversize, Slim fit"
          className="w-full border px-2 py-1 rounded"
        />
      </div>

      {/* 4) Butonlar */}
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border rounded hover:bg-gray-100"
        >
          İptal
        </button>
        <button
          type="submit"
          disabled={loading}
          className={`px-4 py-2 rounded text-white ${
            loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Kaydediliyor…" : isEdit ? "Güncelle" : "Ekle"}
        </button>
      </div>
    </form>
  );
}
