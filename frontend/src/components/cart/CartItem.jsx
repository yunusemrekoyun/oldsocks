import React from "react";
import { useCart } from "../../context/useCart";
import { FaTrash } from "react-icons/fa";
import { Link } from "react-router-dom";

export default function CartItem({ item }) {
  const { removeFromCart } = useCart();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-xl shadow-md px-4 py-5 transition hover:shadow-lg">
      {/* Sol: Görsel + İsim */}
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <Link to={`/product-details/${item.id}`}>
          <img
            src={item.image}
            alt={item.name}
            className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-md border border-gray-200"
          />
        </Link>

        <div>
          <Link
            to={`/product-details/${item.id}`}
            className="block text-base sm:text-lg font-semibold text-dark1 mb-1 hover:text-primary transition"
          >
            {item.name}
          </Link>
          {item.size && (
            <p className="text-sm text-gray-500">Beden: {item.size}</p>
          )}
          <p className="text-sm text-gray-500">Adet: {item.qty}</p>
        </div>
      </div>

      {/* Orta: Fiyat bilgileri */}
      <div className="flex flex-col items-start sm:items-end text-sm sm:text-base gap-1 w-full sm:w-auto">
        <p className="text-gray-600">
          Fiyat:{" "}
          <span className="text-dark1 font-medium">
            ₺{item.price.toFixed(2)}
          </span>
        </p>
        <p className="text-dark1 font-semibold">
          Toplam: ₺{(item.price * item.qty).toFixed(2)}
        </p>
      </div>

      {/* Sağ: Çöp ikon */}
      <button
        onClick={() => removeFromCart(item.id, item.size)}
        className="text-red-600 hover:text-red-700 transition"
        aria-label="Ürünü sepetten kaldır"
      >
        <FaTrash size={18} />
      </button>
    </div>
  );
}
