// src/components/admin/ProductFormModal.jsx
import React, { useState, useEffect } from "react";
import api from "../../../api";

export default function ProductFormModal({ product, onClose, onSaved }) {
  const isEdit = Boolean(product);

  const [form, setForm] = useState({
    video: undefined, // null yerine undefined
    images: [],
    price: "",
    originalPrice: "",
    discount: "",
    category: "",
    stock: "",
    sizes: "",
    description: "",
    color: "",
  });

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api.get("/categories").then((res) => setCategories(res.data));

    if (product) {
      setForm({
        ...product,
        sizes: product.sizes?.join(",") || "",
        video: undefined, // file input'a value verilmemeli
        images: [], // aynı şekilde boş dizi
      });
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (files) {
      if (name === "video") {
        setForm((f) => ({ ...f, video: files[0] }));
      } else {
        setForm((f) => ({ ...f, images: [...files] }));
      }
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData();

    if (form.video) fd.append("video", form.video);
    form.images.forEach((img) => fd.append("images", img));

    [
      "price",
      "originalPrice",
      "discount",
      "category",
      "stock",
      "description",
      "color",
    ].forEach((key) => fd.append(key, form[key]));
    fd.append("sizes", form.sizes);

    try {
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
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-30 flex items-center justify-center">
      <div className="bg-white w-3/4 max-w-2xl p-6 rounded shadow-lg relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
        >
          ✕
        </button>
        <h2 className="text-xl mb-4">
          {isEdit ? "Ürün Düzenle" : "Yeni Ürün"}
        </h2>
        <form
          onSubmit={handleSubmit}
          className="space-y-4 overflow-auto max-h-[80vh]"
        >
          <div>
            <label>Video</label>
            <input
              type="file"
              name="video"
              accept="video/*"
              onChange={handleChange}
            />
          </div>
          <div>
            <label>Resimler (1–4)</label>
            <input
              type="file"
              name="images"
              accept="image/*"
              multiple
              onChange={handleChange}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {["price", "originalPrice", "discount", "stock", "color"].map(
              (key) => (
                <div key={key}>
                  <label>{key}</label>
                  <input
                    name={key}
                    value={form[key]}
                    onChange={handleChange}
                    className="w-full border px-2 py-1 rounded"
                    required
                  />
                </div>
              )
            )}
          </div>
          <div>
            <label>Kategori</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full border px-2 py-1 rounded"
              required
            >
              <option value="">Seçin</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Bedenler (virgülle ayır)</label>
            <input
              name="sizes"
              value={form.sizes}
              onChange={handleChange}
              className="w-full border px-2 py-1 rounded"
            />
          </div>
          <div>
            <label>Açıklama</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="w-full border px-2 py-1 rounded"
            />
          </div>
          <button
            type="submit"
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {isEdit ? "Güncelle" : "Ekle"}
          </button>
        </form>
      </div>
    </div>
  );
}
