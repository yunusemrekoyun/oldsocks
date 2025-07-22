// src/components/user/UserAccountLayout.jsx
import React, { useState } from "react";
import UserAccount from "./UserAccount";
import AddressList from "./AddressList";
import OrdersList from "./OrdersList"; // ← ekledik

export default function UserAccountLayout() {
  const [tab, setTab] = useState("profile");
  const tabs = [
    { key: "profile", label: "Profil Bilgileri" },
    { key: "addresses", label: "Adresler" },
    { key: "orders", label: "Siparişlerim" }, // ← yeni
  ];

  return (
    <div className="flex space-x-6">
      {/* Sidebar */}
      <aside className="w-1/4 bg-white p-4 rounded shadow">
        <nav className="space-y-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`block w-full text-left px-2 py-1 rounded ${
                tab === t.key
                  ? "bg-dark1 text-white"
                  : "hover:bg-gray-100 text-dark1"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1">
        {tab === "profile" && <UserAccount />}
        {tab === "addresses" && <AddressList />}
        {tab === "orders" && <OrdersList />}
      </main>
    </div>
  );
}
