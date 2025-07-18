// src/components/admin/ProductFormModal.jsx
import React, { useState, useEffect } from "react";
import api from "../../../api";

export default function ProductFormModal({ product, onClose, onSaved }) {
  const isEdit = Boolean(product);
  const [form, setForm] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1) Kategorileri çek (parent ve children’ları da gelsin)
  useEffect(() => {
    api.get("/categories").then((res) => setCategories(res.data));
  }, []);

  // 2) Form state’in initial’i
  useEffect(() => {
    if (product) {
      // product.category: { _id, name, parent: { _id } | null }
      const cat = product.category || {};
      let parent = "";
      let category = "";

      if (cat.parent && typeof cat.parent === "object") {
        // Bu bir alt kategori ürünü
        parent = cat.parent._id;
        category = cat._id;
      } else {
        // Sadece üst kategori ürünü
        parent = cat._id;
        category = "";
      }

      setForm({
        name: product.name || "",
        parent,
        category,
        video: undefined,
        images: [],
        price: product.price ?? "",
        originalPrice: product.originalPrice ?? "",
        discount: product.discount ?? "",
        stock: product.stock ?? "",
        sizes: Array.isArray(product.sizes) ? product.sizes.join(",") : "",
        description: product.description ?? "",
        color: product.color ?? "",
      });
    } else {
      setForm({
        name: "",
        parent: "",
        category: "",
        video: undefined,
        images: [],
        price: "",
        originalPrice: "",
        discount: "",
        stock: "",
        sizes: "",
        description: "",
        color: "",
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
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      if (form.video) fd.append("video", form.video);
      form.images.forEach((img) => fd.append("images", img));
      // Diğer alanlar
      [
        "price",
        "originalPrice",
        "discount",
        "stock",
        "description",
        "color",
      ].forEach((k) => fd.append(k, form[k]));
      fd.append("sizes", form.sizes);
      // Alt kategori seçilmişse onu yoksa ana kategori id’sini kullan
      const categoryId = form.category || form.parent;
      fd.append("category", categoryId);

      if (isEdit) {
        await api.put(`/products/${product._id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post("/products", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      onSaved();
    } catch (err) {
      console.error("Ürün kaydı hatası:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!form) return null;

  // 3) parentCats = ana kategoriler, childCats = seçilen ana kategorinin alt kategorileri
  const parentCats = categories.filter((c) => !c.parent);
  const selectedParent = parentCats.find((c) => c._id === form.parent);
  const childCats = selectedParent?.children || [];

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 overflow-auto max-h-[70vh] p-4"
    >
      {/* Ürün Adı */}
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
      {isEdit && product.video && (
        <div>
          <label className="block">Mevcut Video</label>
          <video src={product.video} controls className="w-full h-48 rounded" />
        </div>
      )}
      {isEdit && product.images.length > 0 && (
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

      {/* Fiyat / Stok / Renk */}
      <div className="grid grid-cols-2 gap-4">
        {["price", "originalPrice", "discount", "stock", "color"].map((k) => (
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

      {/* Bedenler */}
      <div>
        <label>Bedenler (virgülle ayır)</label>
        <input
          name="sizes"
          value={form.sizes}
          onChange={handleChange}
          className="w-full border px-2 py-1 rounded"
        />
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
