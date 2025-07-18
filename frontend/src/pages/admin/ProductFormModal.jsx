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

  // 2) Form state’in initial’i: hem parent hem child dropdown’u doldurmak için
  useEffect(() => {
    if (product) {
      const cat = product.category || {};
      const parentId =
        typeof cat.parent === "object" ? cat.parent?._id : cat?.parent;

      setForm({
        name: product.name || "",
        parent: parentId || "",
        category: cat._id || (typeof cat === "string" ? cat : ""),
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
      fd.append("category", form.category);

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

  // 3) parentCats = üst kategoriler, childCats = seçilen üstün alt kategorileri
  const parentCats = categories.filter((c) => !c.parent);
  const childCats = categories.filter(
    (c) => c.parent && String(c.parent._id) === form.parent
  );

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

      {/* Mevcut video / görüntüler */}
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
              <img key={i} src={img} className="w-24 h-24 rounded" />
            ))}
          </div>
        </div>
      )}

      {/* Yeni dosyalar */}
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

      {/* Fiyat/Stok/Color */}
      <div className="grid grid-cols-2 gap-4">
        {["price", "originalPrice", "discount", "stock", "color"].map((k) => (
          <div key={k}>
            <label>{k}</label>
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
          onChange={(e) => {
            setForm((f) => ({ ...f, parent: e.target.value, category: "" }));
          }}
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

      {/* Alt Kategori */}
      <div>
        <label className="block">Alt Kategori</label>
        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          className="w-full border px-2 py-1 rounded"
          required
        >
          <option value="">Seçin</option>
          {childCats.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

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
