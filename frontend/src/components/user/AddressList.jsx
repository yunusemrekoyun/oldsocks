import React, { useEffect, useState } from "react";
import api from "../../../api";
import AddressCard from "./AddressCard";
import AddressForm from "./AddressForm";
import ToastAlert from "../ui/ToastAlert";

/* Basit silme onay modali (yalnızca bu dosyada kullanılıyor) */
const ConfirmModal = ({ open, onClose, onConfirm, message }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full">
        <p className="mb-6 text-dark1">{message}</p>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-light2 hover:bg-light1 transition"
          >
            Vazgeç
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
          >
            Sil
          </button>
        </div>
      </div>
    </div>
  );
};

/* Basit iskelet loader */
const SkeletonCard = () => (
  <div className="rounded-xl border border-light2 bg-white p-4 animate-pulse">
    <div className="h-4 w-32 bg-light2 rounded mb-3" />
    <div className="h-3 w-full bg-light2 rounded mb-2" />
    <div className="h-3 w-2/3 bg-light2 rounded mb-2" />
    <div className="h-3 w-1/3 bg-light2 rounded" />
    <div className="mt-4 h-9 w-28 bg-light2 rounded" />
  </div>
);

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
        setAddresses(Array.isArray(data) ? data : []);
        setError("");
      })
      .catch((err) =>
        setError(err.response?.data?.message || "Adresler alınamadı.")
      )
      .finally(() => setLoading(false));
  };

  useEffect(fetchAddresses, []);

  /* Silme akışı */
  const triggerDelete = (id) => setConfirmId(id);

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

  /* ———— UI ———— */

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-light2 overflow-hidden">
      {/* Header / Action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 bg-light1/60 border-b border-light2">
        <div>
          <h3 className="text-lg font-semibold text-dark1">Adreslerim</h3>
          <p className="text-sm text-gray-600">
            Gönderim ve fatura adreslerinizi burada yönetin.
          </p>
        </div>

        {!showForm && (
          <button
            onClick={() => {
              setEditingAddr(null);
              setShowForm(true);
            }}
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-dark1 text-white hover:bg-dark2 transition w-full sm:w-auto"
          >
            + Yeni Adres Ekle
          </button>
        )}
      </div>

      {/* Form alanı */}
      {showForm && (
        <div className="px-5 py-4 border-b border-light2">
          <AddressForm
            address={editingAddr}
            onSuccess={onFormSuccess}
            onCancel={() => {
              setShowForm(false);
              setEditingAddr(null);
            }}
          />
        </div>
      )}

      {/* İçerik */}
      <div className="p-5">
        {/* Hata */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-2">
            {error}
          </div>
        )}

        {/* Yükleniyor */}
        {loading && (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* Boş durum */}
        {!loading && !addresses.length && (
          <div className="text-center py-12">
            <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-light1 flex items-center justify-center">
              <span className="text-2xl">📍</span>
            </div>
            <h4 className="text-dark1 font-semibold mb-1">
              Kayıtlı adres bulunamadı
            </h4>
            <p className="text-gray-600 text-sm mb-4">
              Alışverişi hızlandırmak için adres ekleyin.
            </p>
            <button
              onClick={() => {
                setEditingAddr(null);
                setShowForm(true);
              }}
              className="px-4 py-2 rounded-lg bg-dark1 text-white hover:bg-dark2 transition"
            >
              Adres Ekle
            </button>
          </div>
        )}

        {/* Adres kartları */}
        {!loading && addresses.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
            {addresses.map((addr) => (
              <AddressCard
                key={addr._id}
                addr={addr}
                onEdit={handleEdit}
                onDelete={triggerDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Sil onay modalı */}
      <ConfirmModal
        open={Boolean(confirmId)}
        onClose={() => setConfirmId(null)}
        onConfirm={handleDeleteConfirmed}
        message="Bu adres silinsin mi?"
      />

      {/* Toast (sabit, sağ-altta) */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-[70]">
          <ToastAlert
            msg={toast.msg}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        </div>
      )}
    </div>
  );
}
