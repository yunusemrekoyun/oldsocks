// src/components/user/UserAccountLayout.jsx
import React, { useState } from "react";
import UserAccount from "./UserAccount";
import AddressList from "./AddressList";
import OrdersList from "./OrdersList";

export default function UserAccountLayout() {
  const [tab, setTab] = useState("profile");
  const tabs = [
    { key: "profile", label: "Profil Bilgileri" },
    { key: "addresses", label: "Adreslerim" },
    { key: "orders", label: "Siparişlerim" },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-6 p-6 bg-gray-100 rounded-lg shadow-inner">
      {/* Sidebar */}
      <aside className="w-full md:w-1/4 bg-white rounded-xl shadow-sm p-4">
        <nav className="space-y-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`w-full text-left px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                tab === t.key
                  ? "bg-dark1 text-white shadow-md"
                  : "text-dark1 hover:bg-dark1/10"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Content Area */}
      <main className="flex-1 bg-white p-6 rounded-xl shadow-sm">
        {tab === "profile" && <UserAccount />}
        {tab === "addresses" && <AddressList />}
        {tab === "orders" && <OrdersList />}
      </main>
    </div>
  );
}