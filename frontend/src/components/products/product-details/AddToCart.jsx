import React, { useState } from "react";
import { FaPlus, FaMinus, FaChevronDown } from "react-icons/fa";
import { useCart } from "../../../context/useCart";

export default function AddToCart({
  price = 0,
  sizes = [],
  colors = [],
  productId,
  productName,
  image,
}) {
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [qty, setQty] = useState(1);
  const [showAdded, setShowAdded] = useState(false);
  const { addToCart } = useCart();

  const increment = () => setQty((q) => q + 1);
  const decrement = () => setQty((q) => Math.max(1, q - 1));

  const canAdd =
    (sizes.length === 0 || selectedSize !== null) &&
    (colors.length === 0 || selectedColor !== null);

  const handleAddToCart = () => {
    const item = {
      id: productId,
      name: productName,
      image,
      price,
      size: selectedSize,
      color: selectedColor,
      qty,
    };
    addToCart(item);

    // Buton animasyonu için tetikle
    setShowAdded(true);
    setTimeout(() => setShowAdded(false), 2000);

    // Sepet iconunu sallama
    const cartIcon = document.getElementById("cart-icon");
    if (cartIcon) {
      cartIcon.classList.add("animate-shake");
      setTimeout(() => cartIcon.classList.remove("animate-shake"), 500);
    }
  };

  const CustomDropdown = ({ label, options, selected, onChange }) => {
    const [open, setOpen] = useState(false);

    return (
      <div className="relative">
        <label className="block text-sm font-medium text-dark2 mb-2">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between px-4 py-2 border border-light2 rounded-lg bg-white text-dark1 focus:outline-none"
        >
          <span>{selected || "Seçiniz"}</span>
          <FaChevronDown className="w-4 h-4 text-dark2" />
        </button>
        {open && (
          <ul className="absolute z-20 mt-1 w-full bg-white border border-light2 rounded-lg shadow-md max-h-60 overflow-auto">
            {options.map((opt) => (
              <li
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={`px-4 py-2 cursor-pointer hover:bg-light1 ${
                  selected === opt ? "bg-light2 font-medium" : ""
                }`}
              >
                {opt}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
      {/* Fiyat */}
      <div className="text-3xl font-bold text-dark1">{price.toFixed(2)}₺</div>

      {/* Beden */}
      {sizes.length > 0 && (
        <CustomDropdown
          label="Beden"
          options={sizes}
          selected={selectedSize}
          onChange={setSelectedSize}
        />
      )}

      {/* Renk */}
      {colors.length > 0 && (
        <CustomDropdown
          label="Renk"
          options={colors}
          selected={selectedColor}
          onChange={setSelectedColor}
        />
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

      <button
        onClick={handleAddToCart}
        disabled={!canAdd}
        className={`relative w-full py-3 font-medium rounded-lg transition flex items-center justify-center
          ${
            canAdd
              ? "bg-dark1 hover:bg-dark2 text-white"
              : "bg-light2 text-dark2 cursor-not-allowed"
          }`}
      >
        {showAdded ? (
          <span className="animate-pulse">Sepete Başarıyla Eklendi!</span>
        ) : (
          "Sepete Ekle"
        )}
      </button>
    </div>
  );
}
