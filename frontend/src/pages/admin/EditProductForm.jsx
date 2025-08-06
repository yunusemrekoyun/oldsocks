// src/pages/admin/EditProductForm.jsx
import React, { useState, useEffect } from "react";
import api from "../../../api";
import ToastAlert from "../../components/ui/ToastAlert";
import { v4 as uuid } from "uuid";
import { useUploadQueue } from "../../context/UploadQueueContext"; // ☆ queue

export default function EditProductForm({ product, onClose, onSaved }) {
  /* ------------------ State ------------------ */
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    originalPrice: "",
    discount: "",
    description: "",
    color: "",
    sizes: [],
  });

  const [mainCat, setMainCat] = useState("");
  const [subCat, setSubCat] = useState("");
  const [cats, setCats] = useState([]);

  const [videoPreview, setVideoPreview] = useState(null);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [newVideo, setNewVideo] = useState(null);
  const [newImages, setNewImages] = useState([]);

  const [hasChanged, setHasChanged] = useState(false);
  const [submitting, setSubmitting] = useState(false); // ☆
  const [toast, setToast] = useState(null);

  /* ------------ Upload queue helpers ------------ */
  const { addTask, updateTask, removeTask } = useUploadQueue(); // ☆

  /* ---------------- Fetch categories + initial data --------------- */
  useEffect(() => {
    const fetchCats = api.get("/categories");
    const fetchProd = api.get(`/products/${product._id}`);

    Promise.all([fetchCats, fetchProd]).then(([cRes, pRes]) => {
      setCats(cRes.data || []);

      const p = pRes.data;
      const isSub = !!p.category?.parent;
      setMainCat(isSub ? p.category.parent._id : p.category._id);
      setSubCat(isSub ? p.category._id : "");

      setFormData({
        name: p.name || "",
        price: p.price || "",
        originalPrice: p.originalPrice || "",
        discount: p.discount || "",
        description: p.description || "",
        color: p.color || "",
        sizes: p.sizes.map((s) => ({ ...s, id: uuid() })),
      });
      setVideoPreview(p.video || null);
      setImagePreviews(p.images || []);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    setFormData((p) => ({
      ...p,
      sizes: p.sizes.filter((s) => s.id !== id),
    }));
    setHasChanged(true);
  };

  const onMainCatChange = (id) => {
    setMainCat(id);
    setSubCat("");
    setHasChanged(true);
  };
  const onSubCatChange = (id) => {
    setSubCat(id);
    setHasChanged(true);
  };

  /* ----------------------- Submit ------------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const fd = new FormData();
    Object.entries(formData).forEach(([k, v]) => {
      if (k === "sizes") fd.append(k, JSON.stringify(v));
      else fd.append(k, v);
    });
    fd.append("category", subCat || mainCat);
    if (newVideo) fd.append("video", newVideo);
    newImages.forEach((img) => fd.append("images", img));

    /* ---------- queue entegrasyonu ---------- */
    const taskId = uuid();
    addTask({
      id: taskId,
      name: `Ürün güncelleniyor: ${formData.name || "Ürün"}`,
      progress: 0,
    });

    try {
      await api.put(`/products/${product._id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (ev) =>
          updateTask(taskId, {
            progress: Math.round((ev.loaded * 100) / ev.total),
          }),
      });

      updateTask(taskId, { progress: 100, status: "success" });
      setTimeout(() => removeTask(taskId), 1800);

      setToast({ msg: "Ürün güncellendi", type: "success" });
      onSaved();
    } catch (err) {
      console.error("Ürün güncelleme hatası:", err);
      updateTask(taskId, {
        progress: 100,
        status: "error",
        errorMsg: "Güncelleme hatası",
      });
      setTimeout(() => removeTask(taskId), 4000);

      setToast({ msg: "Güncelleme hatası", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  /* ----------------------- JSX ------------------------- */
  const subOptions = (() => {
    const root = cats.find((c) => c._id === mainCat);
    if (root?.children?.length) return root.children;
    return cats.filter(
      (c) =>
        c.parent === mainCat ||
        (typeof c.parent === "object" && c.parent?._id === mainCat)
    );
  })();

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8 bg-white p-6 rounded-lg shadow-md"
    >
      {/* Temel Bilgiler */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Ad */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Ürün Adı</label>
          <input
            name="name"
            value={formData.name}
            onChange={handleInput}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        {/* Fiyat */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Fiyat</label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleInput}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        {/* Orijinal Fiyat */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Orijinal Fiyat</label>
          <input
            type="number"
            name="originalPrice"
            value={formData.originalPrice}
            onChange={handleInput}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        {/* İndirim */}
        <div className="space-y-1">
          <label className="text-sm font-medium">İndirim (%)</label>
          <input
            type="number"
            name="discount"
            value={formData.discount}
            onChange={handleInput}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        {/* Renk */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Renk</label>
          <input
            name="color"
            value={formData.color}
            onChange={handleInput}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        {/* Kategori seçimi */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Kategori</label>
          <select
            value={mainCat}
            onChange={(e) => onMainCatChange(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="">Seçiniz</option>
            {cats
              .filter((c) => !c.parent)
              .map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
          </select>

          {subOptions.length > 0 && (
            <select
              value={subCat}
              onChange={(e) => onSubCatChange(e.target.value)}
              className="w-full mt-2 px-4 py-2 border rounded-lg"
            >
              <option value="">Alt Kategori Seç</option>
              {subOptions.map((sc) => (
                <option key={sc._id} value={sc._id}>
                  {sc.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Açıklama */}
      <textarea
        name="description"
        value={formData.description}
        onChange={handleInput}
        rows={4}
        className="w-full px-4 py-3 border rounded-lg"
        placeholder="Açıklama"
      />

      {/* Beden & Stok */}
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

      {/* Mevcut Medya */}
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

      {/* Yeni Medya */}
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

      {/* Butonlar */}
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
          disabled={!hasChanged || submitting}
          className={`px-4 py-2 rounded-lg text-white ${
            !hasChanged || submitting
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {submitting ? "Kaydediliyor…" : "Güncelle"}
        </button>
      </div>

      {toast && <ToastAlert {...toast} onClose={() => setToast(null)} />}
    </form>
  );
}
