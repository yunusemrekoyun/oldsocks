// src/components/user/AddressForm.jsx
import React, { useState, useEffect } from "react";
import api from "../../../api";

export default function AddressForm({ address, onSuccess, onCancel }) {
  const [form, setForm] = useState({
    title: "",
    mainaddress: "",
    street: "",
    district: "",
    city: "",
    postalCode: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Eğer düzenleme modundaysa formu doldur
  useEffect(() => {
    if (address) {
      setForm({
        title: address.title || "",
        mainaddress: address.mainaddress || "",
        street: address.street || "",
        district: address.district || "",
        city: address.city || "",
        postalCode: address.postalCode || "",
      });
    }
  }, [address]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (address) {
        // Güncelle
        await api.put(`/users/me/addresses/${address._id}`, form);
      } else {
        // Yeni ekle
        await api.post("/users/me/addresses", form);
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || "Kaydetme başarısız.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded shadow-md space-y-4 mb-6"
    >
      {error && <div className="text-red-600">{error}</div>}

      <div>
        <label className="block text-sm font-medium mb-1">Adres Başlığı</label>
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          required
          className="w-full border p-2 rounded"
          placeholder="Örn: Ev, İş…"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Adres</label>
        <input
          name="mainaddress"
          value={form.mainaddress}
          onChange={handleChange}
          required
          className="w-full border p-2 rounded"
          placeholder="Sokak, bina, daire no…"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Sokak / Cadde</label>
        <input
          name="street"
          value={form.street}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          placeholder="(isteğe bağlı)"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Mahalle / Semt</label>
        <input
          name="district"
          value={form.district}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          placeholder="(isteğe bağlı)"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Şehir</label>
          <input
            name="city"
            value={form.city}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Posta Kodu</label>
          <input
            name="postalCode"
            value={form.postalCode}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border rounded hover:bg-gray-100"
        >
          İptal
        </button>
        <button
          type="submit"
          disabled={loading}
          className={`px-4 py-2 bg-dark1 text-white rounded hover:bg-dark2 ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Kaydediliyor…" : "Kaydet"}
        </button>
      </div>
    </form>
  );
}
