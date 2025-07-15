// src/components/layout/AdminLayout.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function AdminLayout({ children }) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white p-6">
        <h2 className="text-xl mb-4">Admin Panel</h2>
        <nav className="space-y-2">
          <Link to="/" className="block hover:underline">
            Ana Sayfa
          </Link>
          <Link to="/admin/users" className="block hover:underline">
            Kullanıcılar
          </Link>
          <Link to="/admin/settings" className="block hover:underline">
            Ayarlar
          </Link>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 bg-gray-100 p-6">{children}</div>
    </div>
  );
}
