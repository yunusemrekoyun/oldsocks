// src/pages/admin/AddNewColorForm.jsx
import React, { useEffect, useState } from "react";
import api from "../../../api";
import ToastAlert from "../../components/ui/ToastAlert";
import { v4 as uuid } from "uuid"; // satır key'i için

export default function AddNewColorForm({ product, onClose, onSaved }) {
  /* ------------------------------- State ------------------------------ */
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    originalPrice: "",
    discount: "",
    description: "",
    color: "",
    sizes: [],
  });

  const [video, setVideo] = useState(null);
  const [images, setImages] = useState([]);
  const [existingVideo, setExistV] = useState("");
  const [existingImages, setExistI] = useState([]);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isSizeLess, setIsSizeLess] = useState(false); // bedensiz toggle

  /* -------------------------- Ürün detayını çek ----------------------- */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/products/${product._id}`);
        setFormData({
          name: data.name || "",
          price: data.price || "",
          originalPrice: data.originalPrice || "",
          discount: data.discount || "",
          description: data.description || "",
          category: data.category?._id || "",
          color: "",
          sizes: data.sizes.length ? data.sizes : [],
        });
        setExistV(data.video);
        setExistI(data.images);
      } catch (err) {
        console.error("Ürün detayları alınamadı:", err);
      }
    })();
  }, [product]);

  /* --------------------------- Handler'lar ---------------------------- */
  const handleInput = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSizeChange = (i, key, value) => {
    setFormData((p) => {
      const list = [...p.sizes];
      list[i][key] = key === "stock" ? Number(value) : value;
      return { ...p, sizes: list };
    });
  };

  const addSizeRow = () =>
    setFormData((p) => ({
      ...p,
      sizes: [...p.sizes, { id: uuid(), size: "", stock: 0 }],
    }));

  const removeSizeRow = (id) =>
    setFormData((p) => ({ ...p, sizes: p.sizes.filter((s) => s.id !== id) }));

  /* --------------------------- Submit -------------------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.color.trim()) {
      return setToast({ msg: "Renk alanı zorunludur.", type: "error" });
    }

    if (!isSizeLess && formData.sizes.length === 0) {
      return setToast({
        msg: "En az bir beden satırı ekleyin.",
        type: "error",
      });
    }

    const fd = new FormData();
    ["name", "price", "originalPrice", "discount", "description"].forEach((f) =>
      fd.append(f, formData[f])
    );
    fd.append("color", formData.color.trim());
    fd.append(
      "sizes",
      JSON.stringify(
        isSizeLess
          ? [{ size: "", stock: formData.sizes[0]?.stock || 0 }]
          : formData.sizes
      )
    );

    if (video) fd.append("video", video);
    images.forEach((img) => fd.append("images", img));

    try {
      setSubmitting(true);
      await api.post(`/products/new-color/${product._id}`, fd);
      setToast({ msg: "Yeni renk eklendi.", type: "success" });
      onSaved();
    } catch (err) {
      setToast({
        msg:
          err?.response?.data?.message || "Yeni renk eklenirken hata oluştu.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  /* ----------------------------- JSX --------------------------------- */
  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8 bg-white p-6 rounded-lg shadow-md"
    >
      {/* --- Renk --- */}
      <div>
        <label className="block text-sm font-medium mb-1">Yeni Renk*</label>
        <input
          name="color"
          value={formData.color}
          onChange={handleInput}
          placeholder="Örn. Kırmızı"
          className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500"
        />
      </div>

      {/* --- Bedensiz seçeneği --- */}
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isSizeLess}
          onChange={(e) => {
            setIsSizeLess(e.target.checked);
            setFormData((p) => ({
              ...p,
              sizes: e.target.checked
                ? [{ id: uuid(), size: "", stock: 0 }]
                : [],
            }));
          }}
        />
        Bedensiz ürün (tek stok)
      </label>

      {/* --- Beden & Stok --- */}
      {!isSizeLess && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium">
              Beden & Stok Satırları
            </label>
            <button
              type="button"
              onClick={addSizeRow}
              className="text-blue-600 text-sm"
            >
              + Satır Ekle
            </button>
          </div>

          {formData.sizes.map(({ id, size, stock }, i) => (
            <div key={id} className="flex items-center gap-3">
              <input
                value={size}
                onChange={(e) => handleSizeChange(i, "size", e.target.value)}
                placeholder="Beden"
                className="flex-1 px-3 py-2 border rounded-lg"
              />
              <input
                value={stock}
                type="number"
                onChange={(e) => handleSizeChange(i, "stock", e.target.value)}
                placeholder="Stok"
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
      )}

      {/* --- Mevcut Medya (ops) --- */}
      {existingVideo && !video && (
        <section>
          <label className="block mb-1 font-medium">Mevcut Video</label>
          <video
            src={existingVideo}
            controls
            className="w-full rounded-lg shadow"
          />
        </section>
      )}
      {existingImages.length > 0 && images.length === 0 && (
        <section>
          <label className="block mb-1 font-medium">Mevcut Görseller</label>
          <div className="grid grid-cols-3 gap-3">
            {existingImages.map((img, i) => (
              <img
                key={i}
                src={img}
                alt=""
                className="w-full aspect-square object-cover rounded-lg"
              />
            ))}
          </div>
        </section>
      )}

      {/* --- Yeni Medya Yükleme --- */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm mb-1 font-medium">Yeni Video</label>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setVideo(e.target.files[0])}
            className="text-sm"
          />
        </div>
        <div>
          <label className="block text-sm mb-1 font-medium">
            Yeni Görseller
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => setImages(Array.from(e.target.files))}
            className="text-sm"
          />
        </div>
      </div>

      {/* --- Butonlar --- */}
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
          disabled={submitting}
          className={`px-4 py-2 rounded-lg text-white ${
            submitting ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
          }`}
        >
          Kaydet
        </button>
      </div>

      {toast && <ToastAlert {...toast} onClose={() => setToast(null)} />}
    </form>
  );
}
