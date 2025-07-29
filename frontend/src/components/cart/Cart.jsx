// src/components/cart/Cart.jsx
import React from "react";
import { useCart } from "../../context/useCart";
import CartItem from "./CartItem";
import { Link } from "react-router-dom";
import { FaShoppingCart } from "react-icons/fa";

export default function Cart() {
  const { items, clearCart } = useCart();

  const totalPrice = items.reduce(
    (total, item) => total + item.price * item.qty,
    0
  );

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-dark1 px-4 text-center">
        <FaShoppingCart size={60} className="mb-4 text-gray-400" />
        <h2 className="text-3xl font-semibold mb-2">Sepetiniz boş</h2>
        <p className="text-gray-500 mb-6">Alışverişe devam ederek favori ürünleri ekleyebilirsiniz.</p>
        <Link
          to="/shop"
          className="bg-dark1 text-white px-8 py-3 rounded-full hover:bg-dark2 transition"
        >
          Alışverişe Başla
        </Link>
      </div>
    );
  }

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
          <Link
            to="/checkout"
            className="bg-dark1 text-white px-8 py-3 rounded-full hover:bg-dark2 transition font-semibold"
          >
            Ödeme Yap
          </Link>
        </div>
      </div>
    </div>
  );
}