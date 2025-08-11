// src/components/admin/CategoryFormModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../../../api";
import { v4 as uuidv4 } from "uuid";
import { useUploadQueue } from "../../context/UploadQueueContext";

const Chip = ({ children }) => (
  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100">
    {children}
  </span>
);

// Basit rozet (renk destekli)
const Badge = ({ children, color = "gray" }) => {
  const map = {
    blue: "bg-blue-100 text-blue-800",
    green: "bg-green-100 text-green-800",
    gray: "bg-gray-100 text-gray-700",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${map[color]}`}
    >
      {children}
    </span>
  );
};

export default function CategoryFormModal({ category, onClose, onSaved }) {
  const isEdit = Boolean(category);

  const [form, setForm] = useState({ name: "", image: null });
  const [childrenInput, setChildrenInput] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [dirty, setDirty] = useState(false);

  const { addTask, updateTask, removeTask } = useUploadQueue();

  useEffect(() => {
    if (isEdit) {
      setForm({ name: category.name, image: null });
      setChildrenInput((category.children || []).map((c) => c.name).join(", "));
      setPreviewUrl(category.image || "");
    } else {
      setForm({ name: "", image: null });
      setChildrenInput("");
      setPreviewUrl("");
    }
    setDirty(false);
  }, [category, isEdit]);

  const childTokens = useMemo(() => {
    return childrenInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [childrenInput]);

  const handleChange = (e) => {
    const { name, files, value } = e.target;
    if (name === "image" && files?.length) {
      const file = files[0];
      setForm((f) => ({ ...f, image: file }));
      setPreviewUrl(URL.createObjectURL(file));
      setDirty(true);
    } else if (name === "children") {
      setChildrenInput(value);
      setDirty(true);
    } else {
      setForm((f) => ({ ...f, [name]: value }));
      setDirty(true);
    }
  };

  const isValid =
    form.name.trim().length > 0 && (isEdit || !!(form.image || previewUrl));

  const handleSubmit = async (e) => {
    e.preventDefault();

    const id = uuidv4();
    addTask({ id, name: form.name || "Kategori", progress: 0 });

    const fd = new FormData();
    fd.append("name", form.name);
    if (form.image) fd.append("image", form.image);
    if (childrenInput.trim()) fd.append("children", childrenInput);

    const cfg = {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (ev) => {
        if (!ev.total) return;
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

      updateTask(id, { progress: 100, status: "success" });
      setTimeout(() => removeTask(id), 2000);
      onSaved();
    } catch (err) {
      updateTask(id, {
        progress: 100,
        status: "error",
        errorMsg: err.response?.data?.message || "Kategori kaydedilemedi.",
      });
      setTimeout(() => removeTask(id), 4000);
      onClose();
    } finally {
      onClose(); // formu kapat
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-auto max-h-[75vh] p-1 sm:p-0"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SOL: FORM */}
        <div className="space-y-4">
          {/* Ad */}
          <div>
            <label className="block text-sm font-medium">Kategori Adı *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Örn. Tişört"
            />
          </div>

          {/* Görsel */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Kapak Görseli {isEdit ? "(opsiyonel)" : "*"}
            </label>
            <label className="border-2 border-dashed rounded-xl p-4 flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-50">
              <span className="text-sm">
                {form.image ? form.image.name : "Dosya seçin"}
              </span>
              <input
                type="file"
                name="image"
                accept="image/*"
                className="hidden"
                onChange={handleChange}
                required={!isEdit && !previewUrl}
              />
            </label>
            <p className="text-xs text-gray-500 mt-1">
              1200×600 önerilir. JPG/PNG.
            </p>
          </div>

          {/* Alt kategoriler */}
          <div>
            <label className="block text-sm font-medium">Alt Kategoriler</label>
            <input
              name="children"
              value={childrenInput}
              onChange={handleChange}
              placeholder="Virgülle ayırın: Oversize, Slim fit"
              className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {childTokens.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {childTokens.map((t, i) => (
                  <Chip key={`${t}-${i}`}>{t}</Chip>
                ))}
              </div>
            )}
          </div>

          {!isValid && (
            <p className="text-sm text-red-600">
              Kategori adı ve görsel zorunludur (düzenlemede görsel opsiyonel).
            </p>
          )}

          {/* Butonlar */}
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-100"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={!isValid || !dirty}
              className={`px-4 py-2 rounded-lg text-white ${
                !isValid || !dirty
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isEdit ? "Güncelle" : "Ekle"}
            </button>
          </div>
        </div>

        {/* SAĞ: ÖNİZLEME */}
        <div>
          <p className="text-sm text-gray-600 mb-2">Canlı Önizleme</p>
          <div className="rounded-xl border overflow-hidden">
            <div className="relative h-36">
              {previewUrl ? (
                <img
                  loading="lazy"
                  src={previewUrl}
                  alt="Önizleme"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                  Görsel seçilmedi
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/15 to-transparent" />
              <div className="absolute top-2 left-2">
                <Badge color="blue">{isEdit ? "Düzenleme" : "Yeni"}</Badge>
              </div>
            </div>
            <div className="p-4">
              <p className="font-medium line-clamp-1">
                {form.name || "Kategori adı"}
              </p>
              {childTokens.length > 0 ? (
                <p className="text-sm text-gray-600 mt-1">
                  {childTokens.slice(0, 3).join(", ")}
                  {childTokens.length > 3 ? `, +${childTokens.length - 3}` : ""}
                </p>
              ) : (
                <p className="text-sm text-gray-400 mt-1">Alt kategori yok</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
