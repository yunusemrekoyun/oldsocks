// src/components/AddToCart.jsx
import React, { useState } from "react";
import { FaPlus, FaMinus } from "react-icons/fa";
import { useCart } from "../../../context/useCart";

export default function AddToCart({
  price = 0,
  sizes = [],
  productId,
  productName,
  image,
}) {
  const [selectedSize, setSelectedSize] = useState("");
  const [qty, setQty] = useState(1);
  const { addToCart } = useCart();

  const increment = () => setQty((q) => q + 1);
  const decrement = () => setQty((q) => Math.max(1, q - 1));
  const canAdd = sizes.length === 0 || selectedSize !== "";

  const handleAddToCart = () => {
    const item = {
      id: productId,
      name: productName,
      image,
      price,
      size: selectedSize,
      qty,
    };
    addToCart(item);

    // Yukarı kaydır
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Sepet iconunu salla (shake)
    const cartIcon = document.getElementById("cart-icon");
    if (cartIcon) {
      cartIcon.classList.add("animate-shake");
      setTimeout(() => {
        cartIcon.classList.remove("animate-shake");
      }, 500);
    }

    // Toast bildirimi
    const toast = document.createElement("div");
    toast.textContent = "🛒 Sepete eklendi!";
    toast.className =
      "fixed top-6 left-1/2 -translate-x-1/2 bg-dark1 text-white px-4 py-2 rounded shadow-lg z-50 animate-fadeInOut";
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 2000);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
      {/* Fiyat */}
      <div className="text-3xl font-bold text-dark1">₺{price.toFixed(2)}</div>

      {/* Beden Seçimi */}
      {sizes.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-dark2 mb-2">
            Beden
          </label>
          <select
            value={selectedSize}
            onChange={(e) => setSelectedSize(e.target.value)}
            className="w-full border border-light2 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-dark1 text-dark1 bg-white"
          >
            <option value="" disabled>
              Seçiniz
            </option>
            {sizes.map((sz) => (
              <option key={sz} value={sz}>
                {sz}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Adet Kontrolleri */}
      <div>
        <label className="block text-sm font-medium text-dark2 mb-2">
          Adet
        </label>
        <div className="flex items-center">
          <button
            onClick={decrement}
            className="p-2 border border-light2 rounded-l-lg hover:bg-light1 transition"
          >
            <FaMinus className="text-dark2" />
          </button>
          <input
            type="text"
            readOnly
            value={qty}
            className="w-16 text-center border-t border-b border-light2 text-dark1 px-2 bg-white"
          />
          <button
            onClick={increment}
            className="p-2 border border-light2 rounded-r-lg hover:bg-light1 transition"
          >
            <FaPlus className="text-dark2" />
          </button>
        </div>
      </div>

      {/* Sepete Ekle */}
      <button
        onClick={handleAddToCart}
        disabled={!canAdd}
        className={`w-full py-3 text-white font-medium rounded-lg transition 
          ${
            canAdd
              ? "bg-dark1 hover:bg-dark2"
              : "bg-light2 cursor-not-allowed text-dark2"
          }`}
      >
        Sepete Ekle
      </button>
    </div>
  );
}