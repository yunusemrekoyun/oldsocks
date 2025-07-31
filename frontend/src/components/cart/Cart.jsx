// src/components/cart/Cart.jsx
import React, { useState } from "react";
import { useCart } from "../../context/useCart";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import CartItem from "./CartItem";
import { FaShoppingCart } from "react-icons/fa";
import AuthRequiredModal from "../auth/AuthRequireModal";

export default function Cart() {
  const { items, clearCart } = useCart();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const totalPrice = items.reduce(
    (total, item) => total + item.price * item.qty,
    0
  );

  /* ─────────── sepet boş ─────────── */
  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-dark1 px-4 text-center">
        <FaShoppingCart size={60} className="mb-4 text-gray-400" />
        <h2 className="text-3xl font-semibold mb-2">Sepetiniz boş</h2>
        <p className="text-gray-500 mb-6">
          Alışverişe devam ederek favori ürünleri ekleyebilirsiniz.
        </p>
        <button
          onClick={() => navigate("/shop")}
          className="bg-dark1 text-white px-8 py-3 rounded-full hover:bg-dark2 transition"
        >
          Alışverişe Başla
        </button>

        {/* login modal — muhtemelen tetiklenmez ama güvenli olsun */}
        {showLoginModal && (
          <AuthRequiredModal
            open
            onClose={() => setShowLoginModal(false)}
            onLogin={() => navigate("/profile")}
          />
        )}
      </div>
    );
  }

  /* ─────────── ödeme butonu ─────────── */
  const handleCheckout = () => {
    if (!isLoggedIn) setShowLoginModal(true);
    else navigate("/checkout");
  };

  /* ─────────── normal sepet görünümü ─────────── */
  return (
    <div className="container mx-auto px-4 py-10">
      <h2 className="text-4xl font-bold text-dark1 mb-10 flex items-center gap-3">
        <FaShoppingCart className="text-dark2" size={28} />
        Sepetim
      </h2>

      <div className="space-y-6">
        {items.map((item) => (
          <CartItem key={`${item.id}-${item.size}`} item={item} />
        ))}
      </div>

      <div className="mt-12 border-t border-light2 pt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="text-xl text-dark1 font-semibold">
          Toplam Tutar:{" "}
          <span className="text-2xl text-primary font-bold">
            ₺{totalPrice.toFixed(2)}
          </span>
        </div>

        <div className="flex gap-4 flex-wrap">
          <button
            onClick={clearCart}
            className="bg-light2 text-dark2 px-6 py-3 rounded-full hover:bg-light1 transition font-medium"
          >
            Sepeti Temizle
          </button>
          <button
            onClick={handleCheckout}
            className="bg-dark1 text-white px-8 py-3 rounded-full hover:bg-dark2 transition font-semibold"
          >
            Ödeme Yap
          </button>
        </div>
      </div>

      {showLoginModal && (
        <AuthRequiredModal
          open
          onClose={() => setShowLoginModal(false)}
          onLogin={() => navigate("/profile")}
        />
      )}
    </div>
  );
}
