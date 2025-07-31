import React from "react";
import { createPortal } from "react-dom";
import { FaTimes } from "react-icons/fa";

/**
 * Kullanıcı giriş yapmadığında gösterilen pop-up.
 *
 * Props
 * ───────────────
 * open      : boolean            → Modal açık mı?
 * onClose   : () => void         → Çarpıya basıldığında
 * onLogin   : () => void         → “Giriş Yap” butonu
 */
export default function AuthRequiredModal({ open, onClose, onLogin }) {
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="relative w-full max-w-sm bg-white rounded-xl p-6 shadow-lg">
        {/* Çarpı */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"
          aria-label="Kapat"
        >
          <FaTimes size={20} />
        </button>

        <h2 className="text-xl font-semibold mb-2 text-dark1">
          Giriş Yapmanız Gerekiyor
        </h2>
        <p className="text-gray-600 mb-6">
          Ödeme işlemine devam edebilmek için lütfen hesabınıza giriş yapın.
        </p>

        <button
          onClick={onLogin}
          className="w-full py-3 bg-dark1 hover:bg-dark2 text-white rounded-full font-medium transition"
        >
          Giriş Yap
        </button>
      </div>
    </div>,
    document.body
  );
}
