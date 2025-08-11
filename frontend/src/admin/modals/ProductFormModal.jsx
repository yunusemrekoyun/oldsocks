// src/pages/admin/modals/ProductFormModal.jsx
import React, { useState, useEffect, useMemo } from "react";
import api from "../../../api";
import { useUploadQueue } from "../../context/UploadQueueContext";
import { v4 as uuidv4 } from "uuid";

const Badge = ({ children }) => (
  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
    {children}
  </span>
);

export default function ProductFormModal({ product, onClose, onSaved }) {
  // Bu form normalde "yeni ürün" için kullanılıyor; yine de esneklik dursun
  const isEdit = Boolean(product?._id);
  const [form, setForm] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const { addTask, updateTask, removeTask } = useUploadQueue();
  const [isNewColor, setIsNewColor] = useState(false);

  /* --------- Kategoriler --------- */
  useEffect(() => {
    api.get("/categories").then((res) => setCategories(res.data));
  }, []);

  /* --------- Formu başlat --------- */
  useEffect(() => {
    if (product?.parentProductId && !product._id) {
      // Base ürünün üzerine yeni renk ekleme akışı (nadir durum)
      setIsNewColor(true);
      api.get(`/products/${product.parentProductId}`).then((res) => {
        const p = res.data;
        const cat = p.category || {};
        let parent = "",
          category = "";
        if (cat.parent && typeof cat.parent === "object") {
          parent = cat.parent._id;
          category = cat._id;
        } else {
          parent = cat._id;
          category = "";
        }
        setForm({
          name: p.name || "",
          parent,
          category,
          video: undefined,
          images: [],
          // 🎯 Yeni mantıkta 'price' alanını kullanıcı girmez → otomatik hesaplanacak
          originalPrice: p.originalPrice ?? "",
          discount: p.discount ?? "",
          sizes: Array.isArray(p.sizes)
            ? p.sizes.map((s) => ({ size: s.size, stock: s.stock }))
            : [],
          description: p.description ?? "",
          color: "",
          parentProductId: p._id,
        });
      });
    } else if (product && product._id) {
      // (Genelde EditProductForm kullanıyoruz; yine de uyumlu kalsın)
      setIsNewColor(false);
      api.get(`/products/${product._id}`).then((res) => {
        const p = res.data;
        const cat = p.category || {};
        let parent = "",
          category = "";
        if (cat.parent && typeof cat.parent === "object") {
          parent = cat.parent._id;
          category = cat._id;
        } else {
          parent = cat._id;
          category = "";
        }
        setForm({
          name: p.name || "",
          parent,
          category,
          video: undefined,
          images: [],
          originalPrice: p.originalPrice ?? "",
          discount: p.discount ?? "",
          sizes: Array.isArray(p.sizes)
            ? p.sizes.map((s) => ({ size: s.size, stock: s.stock }))
            : [],
          description: p.description ?? "",
          color: p.color ?? "",
          parentProductId: p.parentProductId ?? "",
        });
      });
    } else {
      // Yeni ürün
      setIsNewColor(false);
      setForm({
        name: "",
        parent: "",
        category: "",
        video: undefined,
        images: [],
        originalPrice: "",
        discount: "",
        sizes: [],
        description: "",
        color: "",
        parentProductId: "",
      });
    }
  }, [product]);

  /* --------- Parent/Child kategori seçimi --------- */
  const parentCats = useMemo(
    () => categories.filter((c) => !c.parent),
    [categories]
  );
  const selectedParent = useMemo(
    () => parentCats.find((c) => c._id === form?.parent),
    [parentCats, form?.parent]
  );
  const childCats = selectedParent?.children || [];

  /* --------- Türev fiyat (yeni mantık) --------- */
  const numeric = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  const original = numeric(form?.originalPrice);
  const discountPct = numeric(form?.discount);
  const hasDiscount = discountPct > 0;

  const computedPrice = useMemo(() => {
    if (!original) return 0;
    const pct = Math.max(0, Math.min(100, discountPct || 0));
    const discounted = original * (1 - pct / 100);
    // 2 ondalık hassasiyet
    return Number(discounted.toFixed(2));
  }, [original, discountPct]);

  /* --------- Handlers --------- */
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      if (name === "video") setForm((f) => ({ ...f, video: files[0] }));
      else setForm((f) => ({ ...f, images: [...files] }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const addSize = () =>
    setForm((f) => ({ ...f, sizes: [...f.sizes, { size: "", stock: 0 }] }));

  const removeSize = (idx) =>
    setForm((f) => {
      const copy = [...f.sizes];
      copy.splice(idx, 1);
      return { ...f, sizes: copy };
    });

  /* --------- Validasyon --------- */
  const isValid =
    form &&
    form.name.trim() &&
    (form.category || form.parent) &&
    numeric(form.originalPrice) > 0; // price zorunlu değil; otomatik hesaplanıyor

  /* --------- Submit --------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    const id = uuidv4();
    addTask({ id, name: form.name || "Yeni Ürün", progress: 0 });

    const fd = new FormData();
    fd.append("name", form.name);
    if (form.video) fd.append("video", form.video);
    form.images.forEach((img) => fd.append("images", img));

    // 🎯 Backend'e giden alanlar:
    // price → computedPrice, originalPrice → girilen, discount → girilen veya 0
    fd.append("price", String(hasDiscount ? computedPrice : original));
    fd.append("originalPrice", String(original));
    fd.append("discount", String(discountPct || 0));
    fd.append("description", form.description || "");
    fd.append("color", form.color || "");
    fd.append("parentProductId", form.parentProductId || "");
    fd.append("category", form.category || form.parent);
    fd.append("sizes", JSON.stringify(form.sizes));

    try {
      const config = {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (!e.total) return;
          const pct = Math.round((e.loaded * 100) / e.total);
          updateTask(id, { progress: pct });
        },
      };

      if (isEdit && !isNewColor) {
        await api.put(`/products/${product._id}`, fd, config);
      } else {
        await api.post("/products", fd, config);
      }

      updateTask(id, { progress: 100, status: "success" });
      setTimeout(() => removeTask(id), 2000);
      onSaved();
    } catch (err) {
      console.error("Ürün kaydı hatası:", err);
      updateTask(id, {
        progress: 100,
        status: "error",
        errorMsg: err.response?.data?.message || "Ürün kaydedilemedi.",
      });
      setTimeout(() => removeTask(id), 4000);
    } finally {
      setLoading(false);
    }
  };

  if (!form) return null;

  /* --------- UI --------- */
  const fmt = (n) =>
    `₺${Number(n || 0).toLocaleString("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SOL: FORM */}
        <div className="space-y-4">
          {/* Ürün Adı */}
          <div>
            <label className="block text-sm font-medium">Ürün Adı *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full border px-3 py-2 rounded-lg"
              placeholder="Örn. Oversize Tişört"
            />
          </div>

          {/* Fiyatlar (Yeni Mantık) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium">
                Orijinal Fiyat *
              </label>
              <input
                name="originalPrice"
                type="number"
                step="0.01"
                min="0"
                value={form.originalPrice}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded-lg"
                required
                placeholder="Örn. 799.90"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">İndirim (%)</label>
              <input
                name="discount"
                type="number"
                step="1"
                min="0"
                max="100"
                value={form.discount}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded-lg"
                placeholder="Örn. 25"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">
                Hesaplanan Fiyat (otomatik)
              </label>
              <input
                value={hasDiscount ? computedPrice : original}
                readOnly
                className="w-full border px-3 py-2 rounded-lg bg-gray-50 text-gray-700"
              />
            </div>
          </div>

          {/* Renk */}
          <div>
            <label className="block text-sm font-medium">Renk</label>
            <input
              name="color"
              value={form.color}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded-lg"
              placeholder={isNewColor ? "Yeni rengi giriniz" : "Opsiyonel"}
            />
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-sm font-medium">Kategori *</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                name="parent"
                value={form.parent}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    parent: e.target.value,
                    category: "",
                  }))
                }
                className="w-full border px-3 py-2 rounded-lg"
                required
              >
                <option value="">Ana kategori</option>
                {parentCats.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded-lg"
              >
                <option value="">Alt kategori yok</option>
                {childCats.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Beden & Stok */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium">Bedenler</label>
              <button
                type="button"
                onClick={addSize}
                className="text-blue-600 text-sm hover:underline"
              >
                + Satır Ekle
              </button>
            </div>

            <div className="space-y-2 mt-2">
              {form.sizes.map((s, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={s.size}
                    onChange={(e) => {
                      const copy = [...form.sizes];
                      copy[idx].size = e.target.value;
                      setForm((f) => ({ ...f, sizes: copy }));
                    }}
                    placeholder="Beden (S, M, L)"
                    className="w-1/2 border px-3 py-2 rounded-lg"
                    required
                  />
                  <input
                    type="number"
                    value={s.stock}
                    onChange={(e) => {
                      const copy = [...form.sizes];
                      copy[idx].stock = parseInt(e.target.value || 0);
                      setForm((f) => ({ ...f, sizes: copy }));
                    }}
                    placeholder="Stok"
                    className="w-1/2 border px-3 py-2 rounded-lg"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => removeSize(idx)}
                    className="text-red-500"
                    title="Satırı sil"
                  >
                    Sil
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Açıklama */}
          <div>
            <label className="block text-sm font-medium">Açıklama</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded-lg"
              rows={4}
              placeholder="Ürün açıklaması"
            />
          </div>

          {/* Medya */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium">Yeni Video</label>
              <input
                type="file"
                name="video"
                accept="video/*"
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">
                Yeni Görseller (1–4)
              </label>
              <label className="border-2 border-dashed rounded-xl p-4 flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-50">
                <span className="text-sm">
                  {form.images?.length
                    ? `${form.images.length} dosya seçildi`
                    : "Dosya seçin"}
                </span>
                <input
                  type="file"
                  name="images"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleChange}
                />
              </label>
              {form.images?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {Array.from(form.images).map((f, i) => (
                    <Badge key={i}>{f.name}</Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SAĞ: ÖNİZLEME */}
        <div className="space-y-2">
          <p className="text-sm text-gray-600">Canlı Önizleme</p>
          <div className="rounded-xl border overflow-hidden">
            <div className="relative h-48">
              {form.images?.[0] ? (
                <img
                  src={URL.createObjectURL(form.images[0])}
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
                {(form.category || form.parent) && (
                  <Badge>Kategori seçildi</Badge>
                )}
              </div>
            </div>

            <div className="p-4">
              <p className="font-medium line-clamp-1">
                {form.name || "Ürün adı"}
              </p>
              <p className="text-gray-600 text-sm line-clamp-2">
                {form.description || "Kısa açıklama metni burada görünecek."}
              </p>

              {/* Fiyat Görünümü */}
              <div className="mt-2 flex items-baseline gap-2">
                {hasDiscount ? (
                  <>
                    <span className="text-xs text-gray-400 line-through">
                      {fmt(original)}
                    </span>
                    <span className="text-blue-700 font-semibold">
                      {fmt(computedPrice)}
                    </span>
                  </>
                ) : (
                  <span className="text-blue-700 font-semibold">
                    {original ? fmt(original) : "Fiyat"}
                  </span>
                )}
                {form.color && <Badge>{form.color}</Badge>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alt Butonlar */}
      <div className="flex justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border rounded-lg hover:bg-gray-100"
        >
          Vazgeç
        </button>
        <button
          type="submit"
          disabled={loading || !isValid}
          className={`px-4 py-2 rounded-lg text-white ${
            loading || !isValid
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Kaydediliyor…" : isEdit ? "Güncelle" : "Ekle"}
        </button>
      </div>
    </form>
  );
}
