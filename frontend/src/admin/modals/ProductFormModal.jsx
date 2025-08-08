// src/components/admin/ProductFormModal.jsx
import React, { useState, useEffect } from "react";
import api from "../../../api";
import { useUploadQueue } from "../../context/UploadQueueContext";
import { v4 as uuidv4 } from "uuid";

export default function ProductFormModal({ product, onClose, onSaved }) {
  const isEdit = Boolean(product?._id);
  const [form, setForm] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const { addTask, updateTask, removeTask } = useUploadQueue();
  const [isNewColor, setIsNewColor] = useState(false);
  useEffect(() => {
    api.get("/categories").then((res) => setCategories(res.data));
  }, []);

  useEffect(() => {
    if (product?.parentProductId && !product._id) {
      // Yeni renk oluşturma modunda
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
          price: p.price ?? "",
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
          price: p.price ?? "",
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
      setIsNewColor(false);
      setForm({
        name: "",
        parent: "",
        category: "",
        video: undefined,
        images: [],
        price: "",
        originalPrice: "",
        discount: "",
        sizes: [],
        description: "",
        color: "",
        parentProductId: "",
      });
    }
  }, [product]);
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      if (name === "video") setForm((f) => ({ ...f, video: files[0] }));
      else setForm((f) => ({ ...f, images: [...files] }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const id = uuidv4();
    addTask({ id, name: form.name || "Yeni Ürün", progress: 0 });

    const fd = new FormData();
    fd.append("name", form.name);
    if (form.video) fd.append("video", form.video);
    form.images.forEach((img) => fd.append("images", img));
    [
      "price",
      "originalPrice",
      "discount",
      "description",
      "color",
      "parentProductId",
    ].forEach((k) => fd.append(k, form[k]));
    fd.append("category", form.category || form.parent);
    fd.append("sizes", JSON.stringify(form.sizes));

    try {
      const config = {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
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

  const parentCats = categories.filter((c) => !c.parent);
  const selectedParent = parentCats.find((c) => c._id === form.parent);
  const childCats = selectedParent?.children || [];

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 overflow-auto max-h-[70vh] p-4"
    >
      <div>
        <label className="block">Ürün Adı</label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          className="w-full border px-2 py-1 rounded"
        />
      </div>

      {/* Mevcut Video / Resimler */}
      {isEdit && product?.video && (
        <div>
          <label className="block">Mevcut Video</label>
          <video src={product.video} controls className="w-full h-48 rounded" />
        </div>
      )}
      {isEdit && product?.images?.length > 0 && (
        <div>
          <label className="block">Mevcut Resimler</label>
          <div className="flex gap-2 flex-wrap">
            {product.images.map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`img-${i}`}
                className="w-24 h-24 rounded"
              />
            ))}
          </div>
        </div>
      )}

      {/* Yeni Dosyalar */}
      <div>
        <label>Yeni Video</label>
        <input
          type="file"
          name="video"
          accept="video/*"
          onChange={handleChange}
        />
      </div>
      <div>
        <label>Yeni Resimler (1–4)</label>
        <input
          type="file"
          name="images"
          multiple
          accept="image/*"
          onChange={handleChange}
        />
      </div>

      {/* Fiyat / Renk */}
      <div className="grid grid-cols-2 gap-4">
        {["price", "originalPrice", "discount"].map((k) => (
          <div key={k}>
            <label className="block">{k}</label>
            <input
              name={k}
              value={form[k]}
              onChange={handleChange}
              className="w-full border px-2 py-1 rounded"
              required
            />
          </div>
        ))}
        <div>
          <label className="block">color</label>
          <input
            name="color"
            value={form.color}
            onChange={handleChange}
            className="w-full border px-2 py-1 rounded"
            placeholder={isNewColor ? "Yeni rengi buraya giriniz" : "Opsiyonel"}
          />
        </div>
      </div>
      {/* Ana Kategori */}
      <div>
        <label className="block">Ana Kategori</label>
        <select
          name="parent"
          value={form.parent}
          onChange={(e) =>
            setForm((f) => ({ ...f, parent: e.target.value, category: "" }))
          }
          className="w-full border px-2 py-1 rounded"
          required
        >
          <option value="">Seçin</option>
          {parentCats.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Alt Kategori (opsiyonel) */}
      {childCats.length > 0 && (
        <div>
          <label className="block">Alt Kategori (opsiyonel)</label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full border px-2 py-1 rounded"
          >
            <option value="">Ana kategoriyi kullan</option>
            {childCats.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Beden ve Stok Alanları */}
      <div>
        <label>Bedenler</label>
        <div className="space-y-2">
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
                placeholder="Beden (örn: S, M)"
                className="w-1/2 border px-2 py-1 rounded"
                required
              />
              <input
                type="number"
                value={s.stock}
                onChange={(e) => {
                  const copy = [...form.sizes];
                  copy[idx].stock = parseInt(e.target.value);
                  setForm((f) => ({ ...f, sizes: copy }));
                }}
                placeholder="Stok"
                className="w-1/2 border px-2 py-1 rounded"
                required
              />
              <button
                type="button"
                onClick={() => {
                  const copy = [...form.sizes];
                  copy.splice(idx, 1);
                  setForm((f) => ({ ...f, sizes: copy }));
                }}
                className="text-red-500 text-sm ml-2"
              >
                Sil
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setForm((f) => ({
                ...f,
                sizes: [...f.sizes, { size: "", stock: 0 }],
              }))
            }
            className="mt-2 text-blue-600 text-sm"
          >
            + Beden Ekle
          </button>
        </div>
      </div>

      {/* Açıklama */}
      <div>
        <label>Açıklama</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          className="w-full border px-2 py-1 rounded"
        />
      </div>

      {/* Butonlar */}
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border rounded"
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
