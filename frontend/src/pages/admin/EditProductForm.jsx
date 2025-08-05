// src/pages/admin/EditProductForm.jsx
import React, { useState, useEffect } from "react";
import api from "../../../api";
import ToastAlert from "../../components/ui/ToastAlert";
import { v4 as uuid } from "uuid";

export default function EditProductForm({ product, onClose, onSaved }) {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    originalPrice: "",
    discount: "",
    description: "",
    category: "",
    color: "",
    sizes: [],
  });

  const [videoPreview, setVideoPreview] = useState(null);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [newVideo, setNewVideo] = useState(null);
  const [newImages, setNewImages] = useState([]);
  const [hasChanged, setHasChanged] = useState(false);
  const [toast, setToast] = useState(null);

  /* ----------------------- İlk veri ----------------------- */
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        price: product.price || "",
        originalPrice: product.originalPrice || "",
        discount: product.discount || "",
        description: product.description || "",
        category: product.category?._id || "",
        color: product.color || "",
        sizes: product.sizes.map((s) => ({ ...s, id: uuid() })),
      });
      setVideoPreview(product.video || null);
      setImagePreviews(product.images || []);
    }
  }, [product]);

  /* ----------------------- Handlers ----------------------- */
  const handleInput = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    setHasChanged(true);
  };

  const handleSizeChange = (i, key, value) => {
    setFormData((p) => {
      const list = [...p.sizes];
      list[i][key] = key === "stock" ? Number(value) : value;
      return { ...p, sizes: list };
    });
    setHasChanged(true);
  };

  const addSizeRow = () => {
    setFormData((p) => ({
      ...p,
      sizes: [...p.sizes, { id: uuid(), size: "", stock: 0 }],
    }));
    setHasChanged(true);
  };

  const removeSizeRow = (id) => {
    setFormData((p) => ({ ...p, sizes: p.sizes.filter((s) => s.id !== id) }));
    setHasChanged(true);
  };

  /* ----------------------- Submit ------------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => {
        if (k === "sizes") fd.append(k, JSON.stringify(v));
        else fd.append(k, v);
      });
      if (newVideo) fd.append("video", newVideo);
      newImages.forEach((img) => fd.append("images", img));

      await api.put(`/products/${product._id}`, fd);
      setToast({ msg: "Ürün güncellendi", type: "success" });
      onSaved();
    } catch (err) {
      console.error(err);
      setToast({ msg: "Güncelleme hatası", type: "error" });
    }
  };

  /* ------------------------- JSX ------------------------- */
  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8 bg-white p-6 rounded-lg shadow-md"
    >
      {/* -- Temel Bilgiler -- */}
      {/* -- Temel Bilgiler -- */}
      <div className="grid md:grid-cols-2 gap-5">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Ürün Adı</label>
          <input
            name="name"
            value={formData.name}
            onChange={handleInput}
            placeholder="Ürün Adı"
            className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Fiyat</label>
          <input
            name="price"
            value={formData.price}
            onChange={handleInput}
            type="number"
            placeholder="Fiyat"
            className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            Orijinal Fiyat
          </label>
          <input
            name="originalPrice"
            value={formData.originalPrice}
            onChange={handleInput}
            type="number"
            placeholder="Orijinal Fiyat"
            className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            İndirim (%)
          </label>
          <input
            name="discount"
            value={formData.discount}
            onChange={handleInput}
            type="number"
            placeholder="İndirim (%)"
            className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Renk</label>
          <input
            name="color"
            value={formData.color}
            onChange={handleInput}
            placeholder="Renk"
            className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            Kategori ID
          </label>
          <input
            name="category"
            value={formData.category}
            onChange={handleInput}
            placeholder="Kategori ID"
            className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500"
          />
        </div>
      </div>

      {/* -- Açıklama -- */}
      <textarea
        name="description"
        value={formData.description}
        onChange={handleInput}
        placeholder="Açıklama"
        rows={4}
        className="w-full px-4 py-3 border rounded-lg focus:ring-blue-500"
      />

      {/* -- Beden & Stok -- */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="font-medium">Beden & Stok Satırları</label>
          <button
            type="button"
            className="text-blue-600 text-sm"
            onClick={addSizeRow}
          >
            + Satır Ekle
          </button>
        </div>

        {formData.sizes.map(({ id, size, stock }, i) => (
          <div key={id} className="flex items-center gap-3">
            <input
              value={size}
              placeholder="Beden"
              onChange={(e) => handleSizeChange(i, "size", e.target.value)}
              className="flex-1 px-3 py-2 border rounded-lg"
            />
            <input
              value={stock}
              type="number"
              placeholder="Stok"
              onChange={(e) => handleSizeChange(i, "stock", e.target.value)}
              className="w-32 px-3 py-2 border rounded-lg"
            />
            <button
              type="button"
              onClick={() => removeSizeRow(id)}
              className="text-red-500"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* -- Mevcut Medya -- */}
      {videoPreview && (
        <section>
          <label className="block mb-1 font-medium">Mevcut Video</label>
          <video
            src={videoPreview}
            controls
            className="w-full rounded-lg shadow h-56 object-cover"
          />
        </section>
      )}
      {imagePreviews.length > 0 && (
        <section>
          <label className="block mb-1 font-medium">Mevcut Görseller</label>
          <div className="flex flex-wrap gap-3">
            {imagePreviews.map((img, i) => (
              <img
                key={i}
                src={img}
                alt=""
                className="w-24 h-24 rounded-lg object-cover shadow"
              />
            ))}
          </div>
        </section>
      )}

      {/* -- Yeni Medya -- */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Yeni Video</label>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => {
              setNewVideo(e.target.files[0]);
              setHasChanged(true);
            }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Yeni Görseller
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => {
              setNewImages(Array.from(e.target.files));
              setHasChanged(true);
            }}
          />
        </div>
      </div>

      {/* -- Butonlar -- */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border rounded-lg hover:bg-gray-100"
        >
          Vazgeç
        </button>
        <button
          type="submit"
          disabled={!hasChanged}
          className={`px-4 py-2 rounded-lg text-white ${
            hasChanged
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          Güncelle
        </button>
      </div>

      {toast && <ToastAlert {...toast} onClose={() => setToast(null)} />}
    </form>
  );
}
