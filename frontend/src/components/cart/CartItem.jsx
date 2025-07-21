// src/components/cart/CartItem.jsx
import React from "react";
import { useCart } from "../../context/useCart";

export default function CartItem({ item }) {
  const { removeFromCart } = useCart();

  return (
    <div className="flex items-center gap-4 bg-white p-4 rounded shadow-sm flex-col sm:flex-row">
      {/* Görsel */}
      <img
        src={item.image}
        alt={item.name}
        className="w-28 h-28 object-cover rounded"
      />

      {/* Ürün Bilgileri */}
      <div className="flex-1 w-full sm:w-auto">
        <h3 className="text-lg font-semibold text-dark1">{item.name}</h3>
        {item.size && (
          <p className="text-sm text-dark2 mt-1">Beden: {item.size}</p>
        )}
        <p className="text-sm text-dark2">Adet: {item.qty}</p>
        <p className="text-sm text-dark2">Fiyat: ₺{item.price.toFixed(2)}</p>
        <p className="text-sm text-dark1 font-bold mt-1">
          Toplam: ₺{(item.price * item.qty).toFixed(2)}
        </p>
      </div>

      {/* Sil butonu */}
      <button
        onClick={() => removeFromCart(item.id, item.size)}
        className="text-sm text-red-600 hover:underline"
      >
        Kaldır
      </button>
    </div>
  );
}
