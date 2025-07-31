// src/components/admin/CategoryFormModal.jsx
import React, { useState, useEffect } from "react";
import api from "../../../api";
import { v4 as uuidv4 } from "uuid";
import { useUploadQueue } from "../../context/UploadQueueContext";

export default function CategoryFormModal({ category, onClose, onSaved }) {
  const isEdit = Boolean(category);

  /* ─── form state ─── */
  const [form, setForm] = useState({ name: "", image: null });
  const [childrenInput, setChildrenInput] = useState("");

  /* upload queue helpers */
  const { addTask, updateTask, removeTask } = useUploadQueue();

  /* modal açıldığında mevcut veriyi doldur */
  useEffect(() => {
    if (isEdit) {
      setForm({ name: category.name, image: null });
      setChildrenInput((category.children || []).map((c) => c.name).join(", "));
    } else {
      setForm({ name: "", image: null });
      setChildrenInput("");
    }
  }, [category, isEdit]);

  /* form alanlarını yönet */
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

  /* KAYDET */
  const handleSubmit = async (e) => {
    e.preventDefault();

    /* 0) kuyruğa ekle */
    const id = uuidv4();
    addTask({ id, name: form.name || "Kategori", progress: 0 });

    const fd = new FormData();
    fd.append("name", form.name);
    if (form.image) fd.append("image", form.image);
    if (childrenInput.trim()) fd.append("children", childrenInput);

    const cfg = {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (ev) => {
        const pct = Math.round((ev.loaded * 100) / ev.total);
        updateTask(id, { progress: pct });
      },
    };

    try {
      if (isEdit) {
        await api.put(`/categories/${category._id}`, fd, cfg);
      } else {
        await api.post("/categories", fd, cfg);
      }

      /* başarı */
      updateTask(id, { progress: 100, status: "success" });
      setTimeout(() => removeTask(id), 2000);
      onSaved(); // parent listesini yenile
    } catch (err) {
      console.error("Kategori kaydı hatası:", err);
      updateTask(id, {
        progress: 100,
        status: "error",
        errorMsg: err.response?.data?.message || "Kategori kaydedilemedi.",
      });
      setTimeout(() => removeTask(id), 4000);
    } finally {
      onClose(); // modalı kapat
    }
  };

  /* ─── UI ─── */
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 1) Ad */}
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
          className="px-4 py-2 rounded text-white bg-blue-600 hover:bg-blue-700"
        >
          {isEdit ? "Güncelle" : "Ekle"}
        </button>
      </div>
    </form>
  );
}
