import React, { useEffect, useState } from "react";
import api from "../../../api";
import AddressCard from "./AddressCard";
import AddressForm from "./AddressForm";

export default function AddressList() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingAddr, setEditingAddr] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const fetchAddresses = () => {
    setLoading(true);
    api
      .get("/users/me/addresses")
      .then(({ data }) => {
        setAddresses(data);
        setError("");
      })
      .catch((err) =>
        setError(err.response?.data?.message || "Adresler alınamadı.")
      )
      .finally(() => setLoading(false));
  };

  useEffect(fetchAddresses, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Bu adres silinsin mi?")) return;
    try {
      await api.delete(`/users/me/addresses/${id}`);
      setAddresses((list) => list.filter((a) => a._id !== id));
    } catch {
      alert("Adres silinemedi.");
    }
  };

  const handleEdit = (addr) => {
    setEditingAddr(addr);
    setShowForm(true);
  };

  const onFormSuccess = () => {
    setShowForm(false);
    setEditingAddr(null);
    fetchAddresses();
  };

  if (loading) return <div>Yükleniyor…</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="p-6 bg-white rounded shadow-md space-y-6">
      {!showForm && (
        <button
          onClick={() => {
            setEditingAddr(null);
            setShowForm(true);
          }}
          className="px-5 py-2 bg-dark1 text-white rounded hover:bg-dark2 transition"
        >
          + Yeni Adres Ekle
        </button>
      )}

      {showForm && (
        <AddressForm
          address={editingAddr}
          onSuccess={onFormSuccess}
          onCancel={() => {
            setShowForm(false);
            setEditingAddr(null);
          }}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
        {addresses.map((addr) => (
          <AddressCard
            key={addr._id}
            addr={addr}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}