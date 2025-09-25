import React, { useState } from "react";

export default function AddressCard({ addr, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  if (!addr) return null;

  return (
    <div
      className="relative rounded-2xl border border-light2 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition"
      onMouseLeave={() => setMenuOpen(false)}
    >
      {/* Üst kısım: başlık + masaüstü menü */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base sm:text-lg font-semibold text-dark1">
          {addr.title}
        </h3>

        {/* Masaüstü: üç nokta menü */}
        <div className="hidden sm:block">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="rounded-lg px-2 py-1 text-dark2 hover:bg-light1"
            aria-label="Adres seçenekleri"
            title="Seçenekler"
          >
            ⋮
          </button>

          {menuOpen && (
            <div className="absolute right-3 top-10 z-10 w-36 overflow-hidden rounded-lg border border-light2 bg-white shadow-lg">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onEdit(addr);
                }}
                className="block w-full px-4 py-2 text-left text-sm hover:bg-light1"
              >
                Düzenle
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(addr._id);
                }}
                className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              >
                Sil
              </button>
            </div>
          )}
        </div>
      </div>

      {/* İçerik */}
      <div className="mt-2 space-y-1 text-sm text-dark2">
        <p className="leading-6">{addr.mainaddress}</p>
        {(addr.street || addr.district) && (
          <p className="text-gray-600">
            {[addr.street, addr.district].filter(Boolean).join(", ")}
          </p>
        )}
        <p className="font-medium">
          {addr.city} {addr.postalCode ? `• ${addr.postalCode}` : ""}
        </p>
      </div>

      {/* Mobil aksiyon butonları */}
      <div className="mt-4 flex flex-col xs:flex-row gap-2 sm:hidden">
        <button
          onClick={() => onEdit(addr)}
          className="w-full rounded-xl border border-light2 px-4 py-2 text-sm font-medium hover:bg-light1 transition"
        >
          Düzenle
        </button>
        <button
          onClick={() => onDelete(addr._id)}
          className="w-full rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition"
        >
          Sil
        </button>
      </div>
    </div>
  );
}
