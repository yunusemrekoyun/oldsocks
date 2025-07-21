// src/components/cart/Cart.jsx
import React from "react";
import { useCart } from "../../context/useCart";
import CartItem from "./CartItem";
import { Link } from "react-router-dom";

export default function Cart() {
  const { items, clearCart } = useCart();

  const totalPrice = items.reduce(
    (total, item) => total + item.price * item.qty,
    0
  );

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-dark1 px-4 text-center">
        <h2 className="text-2xl font-semibold mb-4">Sepetiniz boş</h2>
        <Link
          to="/shop"
          className="bg-dark1 text-white px-6 py-2 rounded hover:bg-dark2 transition"
        >
          Alışverişe Başla
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-dark1 mb-6">Sepetim</h2>

      <div className="space-y-6">
        {items.map((item) => (
          <CartItem key={`${item.id}-${item.size}`} item={item} />
        ))}
      </div>

      <div className="mt-8 border-t border-light2 pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-lg text-dark1 font-medium">
          Toplam:{" "}
          <span className="text-xl font-bold">₺{totalPrice.toFixed(2)}</span>
        </div>
        <div className="flex gap-4 flex-wrap">
          <button
            onClick={clearCart}
            className="bg-light2 text-dark2 px-4 py-2 rounded hover:bg-light1 transition"
          >
            Sepeti Temizle
          </button>
          <Link
            to="/checkout"
            className="bg-dark1 text-white px-6 py-2 rounded hover:bg-dark2 transition"
          >
            Ödeme Yap
          </Link>
        </div>
      </div>
    </div>
  );
}
