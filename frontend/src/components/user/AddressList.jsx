import React, { useEffect, useState } from "react";
import api from "../../../api";
import AddressCard from "./AddressCard";
import AddressForm from "./AddressForm";
import ToastAlert from "../ui/ToastAlert";

/* Basit silme onay modali (yalnızca bu dosyada kullanılıyor) */
const ConfirmModal = ({ open, onClose, onConfirm, message }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-xl p-6 shadow max-w-sm w-full">
        <p className="mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
          >
            Vazgeç
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
          >
            Sil
          </button>
        </div>
      </div>
    </div>
  );
};

export default function AddressList() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingAddr, setEditingAddr] = useState(null);
  const [showForm, setShowForm] = useState(false);

  /* toast & onay */
  const [toast, setToast] = useState(null);
  const [confirmId, setConfirmId] = useState(null); // silinecek adres id

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

  /* Silme akışı */
  const triggerDelete = (id) => setConfirmId(id); // “Sil” ikonuna basılınca

  const handleDeleteConfirmed = async () => {
    const id = confirmId;
    setConfirmId(null);
    try {
      await api.delete(`/users/me/addresses/${id}`);
      setAddresses((list) => list.filter((a) => a._id !== id));
      setToast({ msg: "Adres silindi.", type: "success" });
    } catch {
      setToast({ msg: "Adres silinemedi.", type: "error" });
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
      {/* Yeni adres butonu */}
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

      {/* Form */}
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

      {/* Adres kartları */}
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
        {addresses.map((addr) => (
          <AddressCard
            key={addr._id}
            addr={addr}
            onEdit={handleEdit}
            onDelete={triggerDelete} // pencere yerine kendi fonksiyonumuz
          />
        ))}
      </div>

      {/* Sil onay modalı */}
      <ConfirmModal
        open={Boolean(confirmId)}
        onClose={() => setConfirmId(null)}
        onConfirm={handleDeleteConfirmed}
        message="Bu adres silinsin mi?"
      />

      {/* Toast */}
      {toast && (
        <ToastAlert
          msg={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
