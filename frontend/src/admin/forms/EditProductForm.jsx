// src/pages/admin/forms/EditProductForm.jsx
import React, { useState, useEffect, useMemo } from "react";
import api from "../../../api";
import ToastAlert from "../../components/ui/ToastAlert";
import { v4 as uuid } from "uuid";
import { useUploadQueue } from "../../context/UploadQueueContext";

const Badge = ({ children }) => (
  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
    {children}
  </span>
);

export default function EditProductForm({ product, onClose, onSaved }) {
  const [formData, setFormData] = useState({
    name: "",
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
  const [newVideoUrl, setNewVideoUrl] = useState(null);
  const [newImages, setNewImages] = useState([]);
  const [newImageUrls, setNewImageUrls] = useState([]);

  const [hasChanged, setHasChanged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const { addTask, updateTask, removeTask } = useUploadQueue();

  /* ---------------- Fetch + form doldurma ---------------- */
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
        originalPrice: p.originalPrice ?? "",
        discount: p.discount ?? "",
        description: p.description || "",
        color: p.color || "",
        sizes: (p.sizes || []).map((s) => ({ ...s, id: uuid() })),
      });
      setVideoPreview(p.video || null);
      setImagePreviews(p.images || []);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- Yeni seçilen medya için URL yönetimi ---------------- */
  useEffect(() => {
    // images
    const urls = newImages.map((f) => URL.createObjectURL(f));
    setNewImageUrls(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [newImages]);

  useEffect(() => {
    if (!newVideo) {
      setNewVideoUrl(null);
      return;
    }
    const url = URL.createObjectURL(newVideo);
    setNewVideoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [newVideo]);

  /* ---------------- Alt kategori listesi ---------------- */
  const subOptions = useMemo(() => {
    const root = cats.find((c) => c._id === mainCat);
    if (root?.children?.length) return root.children;
    return cats.filter(
      (c) =>
        c.parent === mainCat ||
        (typeof c.parent === "object" && c.parent?._id === mainCat)
    );
  }, [cats, mainCat]);

  /* ---------- Fiyat hesaplama (yeni mantık) ---------- */
  const num = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  const original = num(formData.originalPrice);
  const discountPct = Math.max(0, Math.min(100, num(formData.discount)));
  const hasDiscount = discountPct > 0;
  const computedPrice = useMemo(() => {
    if (!original) return 0;
    const discounted = original * (1 - discountPct / 100);
    return Number(discounted.toFixed(2));
  }, [original, discountPct]);

  /* ---------------- Handlers ---------------- */
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const fd = new FormData();
    // Backend alanları: price → computed, originalPrice & discount → girildiği gibi
    fd.append("name", formData.name || "");
    fd.append("price", String(hasDiscount ? computedPrice : original));
    fd.append("originalPrice", String(original));
    fd.append("discount", String(discountPct || 0));
    fd.append("description", formData.description || "");
    fd.append("color", formData.color || "");
    fd.append("sizes", JSON.stringify(formData.sizes || []));
    fd.append("category", subCat || mainCat);

    if (newVideo) fd.append("video", newVideo);
    newImages.forEach((img) => fd.append("images", img));

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

  const fmt = (n) =>
    `₺${Number(n || 0).toLocaleString("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  /* ---------------- UI ---------------- */
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* iki kolon: mobile 1, xl 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* SOL: FORM */}
        <div className="space-y-4 bg-white p-4 sm:p-6 rounded-lg shadow-md">
          {/* üst alanlar */}
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Ürün Adı */}
            <div className="space-y-1 min-w-0">
              <label className="text-sm font-medium">Ürün Adı</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleInput}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Örn. Oversize Tişört"
              />
            </div>

            {/* Renk */}
            <div className="space-y-1 min-w-0">
              <label className="text-sm font-medium">Renk</label>
              <input
                name="color"
                value={formData.color}
                onChange={handleInput}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Örn. Siyah"
              />
            </div>

            {/* Fiyatlar */}
            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1 min-w-0">
                <label className="text-sm font-medium">Orijinal Fiyat *</label>
                <input
                  type="number"
                  inputMode="decimal"
                  name="originalPrice"
                  min="0"
                  step="0.01"
                  value={formData.originalPrice}
                  onChange={handleInput}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Örn. 799.90"
                />
              </div>
              <div className="space-y-1 min-w-0">
                <label className="text-sm font-medium">İndirim (%)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  name="discount"
                  min="0"
                  max="100"
                  step="1"
                  value={formData.discount}
                  onChange={handleInput}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Örn. 25"
                />
              </div>
              <div className="space-y-1 min-w-0">
                <label className="text-sm font-medium">
                  Hesaplanan Fiyat (otomatik)
                </label>
                <input
                  readOnly
                  value={hasDiscount ? computedPrice : original}
                  className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-700"
                  aria-readonly="true"
                />
              </div>
            </div>

            {/* Kategori */}
            <div className="space-y-1 min-w-0">
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
          <div className="min-w-0">
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInput}
              rows={4}
              className="w-full px-4 py-3 border rounded-lg"
              placeholder="Açıklama"
            />
          </div>

          {/* Beden & Stok — mobile-first */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <label className="font-medium">Beden & Stok Satırları</label>
              <button
                type="button"
                className="text-blue-600 text-sm self-start sm:self-auto"
                onClick={addSizeRow}
              >
                + Satır Ekle
              </button>
            </div>

            <div className="space-y-2">
              {formData.sizes.map(({ id, size, stock }, i) => (
                <div
                  key={id}
                  className="grid grid-cols-4 gap-2 sm:gap-3 items-center"
                >
                  {/* mobil: 2 kolon — Beden(2) Stok(1) Sil(1) */}
                  <input
                    value={size}
                    placeholder="Beden"
                    onChange={(e) =>
                      handleSizeChange(i, "size", e.target.value)
                    }
                    className="col-span-2 px-3 py-2 border rounded-lg"
                  />
                  <input
                    value={stock}
                    type="number"
                    inputMode="numeric"
                    placeholder="Stok"
                    onChange={(e) =>
                      handleSizeChange(i, "stock", e.target.value)
                    }
                    className="col-span-1 px-3 py-2 border rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeSizeRow(id)}
                    className="col-span-1 text-red-500 justify-self-end px-3 py-2 rounded hover:bg-red-50"
                    title="Satırı sil"
                    aria-label="Satırı sil"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Yeni Medya */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                Yeni Video
              </label>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => {
                  setNewVideo(e.target.files[0] || null);
                  setHasChanged(true);
                }}
                className="block w-full text-sm"
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
                  setNewImages(Array.from(e.target.files || []));
                  setHasChanged(true);
                }}
                className="block w-full text-sm"
              />
            </div>
          </div>

          {/* Butonlar */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-100 w-full sm:w-auto"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={!hasChanged || submitting || !original}
              className={`px-4 py-2 rounded-lg text-white w-full sm:w-auto ${
                !hasChanged || submitting || !original
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {submitting ? "Kaydediliyor…" : "Güncelle"}
            </button>
          </div>

          {toast && <ToastAlert {...toast} onClose={() => setToast(null)} />}
        </div>

        {/* SAĞ: ÖNİZLEME */}
        <div className="space-y-4">
          {/* Görsel Önizleme */}
          {(imagePreviews.length > 0 || newImageUrls.length > 0) && (
            <section className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
              <label className="block mb-2 font-medium">Görsel Önizleme</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {(newImageUrls.length ? newImageUrls : imagePreviews).map(
                  (src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt=""
                      className="w-full aspect-square object-cover rounded-lg"
                      loading="lazy"
                    />
                  )
                )}
              </div>
            </section>
          )}

          {/* Video Önizleme */}
          {(videoPreview || newVideoUrl) && (
            <section className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
              <label className="block mb-2 font-medium">Video Önizleme</label>
              <video
                src={newVideoUrl || videoPreview}
                controls
                className="w-full rounded-lg shadow h-56 object-cover"
              />
            </section>
          )}

          {/* Kart Önizleme */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="p-4">
              <p className="font-medium line-clamp-1">
                {formData.name || "Ürün adı"}
              </p>
              {/* Fiyat görünümü — indirim varsa çizgili orijinal + indirimli */}
              <div className="mt-2 flex items-baseline gap-2">
                {hasDiscount ? (
                  <>
                    <span className="text-xs text-gray-400 line-through">
                      {original ? fmt(original) : "—"}
                    </span>
                    <span className="text-blue-700 font-semibold">
                      {computedPrice ? fmt(computedPrice) : "—"}
                    </span>
                  </>
                ) : (
                  <span className="text-blue-700 font-semibold">
                    {original ? fmt(original) : "Fiyat"}
                  </span>
                )}
                {formData.color && <Badge>{formData.color}</Badge>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
