// src/components/user/AddressCard.jsx
import React, { useState } from "react";

export default function AddressCard({ addr, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  if (!addr) return null;

  return (
    <div
      className="relative bg-white p-4 rounded shadow group"
      onMouseLeave={() => setMenuOpen(false)}
    >
      {/* 3 nokta butonu */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="text-xl leading-none p-1"
        >
          ⋮
        </button>
      </div>

      {/* Açılır menü */}
      {menuOpen && (
        <div className="absolute right-2 mt-8 w-32 bg-white border rounded shadow-md z-10">
          <button
            onClick={() => {
              setMenuOpen(false);
              onEdit(addr);
            }}
            className="block w-full text-left px-4 py-2 hover:bg-gray-100"
          >
            Düzenle
          </button>
          <button
            onClick={() => {
              setMenuOpen(false);
              onDelete(addr._id);
            }}
            className="block w-full text-left px-4 py-2 hover:bg-gray-100"
          >
            Sil
          </button>
        </div>
      )}

      {/* Adres bilgileri */}
      <h3 className="font-semibold mb-1">{addr.title}</h3>
      <p className="text-sm">{addr.mainaddress}</p>
      <p className="text-sm">
        {addr.street}, {addr.district}
      </p>
      <p className="text-sm">
        {addr.city} / {addr.postalCode}
      </p>
    </div>
  );
}
