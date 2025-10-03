// src/components/products/product-details/AddToCart.jsx
import React, { useState, useEffect, useRef } from "react";
import { FaPlus, FaMinus, FaChevronDown } from "react-icons/fa";
import { useCart } from "../../../context/useCart";
import { useNavigate } from "react-router-dom";
import api from "../../../../api";

export default function AddToCart({
  price = 0,
  sizes = [],
  color = "",
  productId,
  productName,
  image,
  parentProductId,
}) {
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(color || null);
  const [colorOptions, setColorOptions] = useState([]);
  const [qty, setQty] = useState(1);
  const [available, setAvailable] = useState(Infinity);
  const [warn, setWarn] = useState("");
  const [showAdded, setShowAdded] = useState(false); // sadece yazı için
  const [hasAddedToCart, setHasAddedToCart] = useState(false); // buton için

  const { addToCart } = useCart();
  const navigate = useNavigate();
  const sentWarnRef = useRef(false);

  /* varyant renkleri çek */
  useEffect(() => {
    (async () => {
      try {
        const baseId = parentProductId || productId;
        const { data } = await api.get(`/products?varyantsOf=${baseId}`);
        setColorOptions((data || []).filter((p) => p.color?.trim()));
      } catch (err) {
        console.error("Varyant renkler alınamadı:", err);
      }
    })();
  }, [productId, parentProductId]);

  /* ürün değişince seçili rengi sıfırla */
  useEffect(() => {
    setSelectedColor(color || null);
  }, [productId, color]);

  /* seçilen bedene göre stok */
  useEffect(() => {
    if (sizes.length === 0) {
      setAvailable(Infinity);
      return;
    }
    const row = sizes.find((s) => s.size === selectedSize);
    const stock = row ? row.stock : 0;
    setAvailable(stock);
    setQty((q) => Math.min(q, stock || 1));
  }, [selectedSize, sizes]);

  /* adet kontrolleri */
  const increment = () => {
    setQty((q) => {
      if (q + 1 > available) {
        showWarn(`Bu bedende en fazla ${available} adet ekleyebilirsiniz.`);
        return q;
      }
      return q + 1;
    });
  };
  const decrement = () => setQty((q) => Math.max(1, q - 1));

  const showWarn = (msg) => {
    if (sentWarnRef.current) return;
    setWarn(msg);
    sentWarnRef.current = true;
    setTimeout(() => {
      setWarn("");
      sentWarnRef.current = false;
    }, 2000);
  };

  /* sepete ekle */
  const canAdd =
    (sizes.length === 0 || selectedSize !== null) &&
    (colorOptions.length === 0 || selectedColor !== null);

  const handleAddToCart = () => {
    if (qty > available) {
      showWarn(`Bu bedende en fazla ${available} adet ekleyebilirsiniz.`);
      return;
    }

    addToCart({
      id: productId,
      name: productName,
      image,
      price,
      size: selectedSize,
      color: selectedColor,
      qty,
    });

    // geçici yazı
    setShowAdded(true);
    setTimeout(() => setShowAdded(false), 2000);
    // kalıcı buton
    setHasAddedToCart(true);

    const cartIcon = document.getElementById("cart-icon");
    if (cartIcon) {
      cartIcon.classList.add("animate-shake");
      setTimeout(() => cartIcon.classList.remove("animate-shake"), 500);
    }
  };

  /* dropdown component */
  const CustomDropdown = ({
    label,
    options,
    selected,
    onChange,
    getLabel,
    isDisabled,
  }) => {
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
            {options.map((opt) => {
              const disabled = isDisabled?.(opt);
              return (
                <li
                  key={getLabel(opt)}
                  onClick={() => {
                    if (disabled) return;
                    onChange(getLabel(opt));
                    setOpen(false);
                  }}
                  className={`px-4 py-2 cursor-pointer ${
                    disabled
                      ? "text-gray-400 cursor-not-allowed"
                      : "hover:bg-light1"
                  } ${
                    selected === getLabel(opt) ? "bg-light2 font-medium" : ""
                  }`}
                >
                  {getLabel(opt)}
                  {disabled && " (Tükendi)"}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  };

  /* renk değiştir */
  const handleColorChange = (newColor) => {
    const found = colorOptions.find((opt) => opt.color === newColor);
    if (!found) return;
    if (found._id === productId) {
      setSelectedColor(newColor);
    } else {
      navigate(`/product-details/${found._id}`, { replace: true });
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
      {/* fiyat */}
      <div className="text-3xl font-bold text-dark1">{price.toFixed(2)}₺</div>

      {/* beden */}
      {sizes.length > 0 && (
        <CustomDropdown
          label="Beden"
          options={sizes}
          selected={selectedSize}
          onChange={setSelectedSize}
          getLabel={(opt) => opt.size}
          isDisabled={(opt) => opt.stock <= 0}
        />
      )}

      {/* renk */}
      {colorOptions.some((opt) => opt._id !== productId) && (
        <CustomDropdown
          label="Renk"
          options={colorOptions}
          selected={selectedColor}
          onChange={handleColorChange}
          getLabel={(opt) => opt.color}
        />
      )}

      {/* adet */}
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
        {warn && (
          <p className="text-xs text-red-600 mt-2 text-center">{warn}</p>
        )}
      </div>

      {/* sepete ekle */}
      <button
        onClick={handleAddToCart}
        disabled={!canAdd}
        className={`relative w-full py-3 font-medium rounded-lg transition flex items-center justify-center ${
          canAdd
            ? "bg-dark1 hover:bg-dark2 text-white"
            : "bg-light2 text-dark2 cursor-not-allowed"
        }`}
      >
        {showAdded ? (
          <span className="animate-pulse">Sepete eklendi</span>
        ) : (
          "Sepete Ekle"
        )}
      </button>

      {/* alışverişi tamamla — sayfadan çıkana kadar görünür */}
      {hasAddedToCart && (
        <button
          type="button"
          onClick={() => navigate("/cart")}
          className="w-full py-3 rounded-lg border border-dark1 text-dark1 font-semibold hover:bg-dark1 hover:text-white transition"
        >
          Alışverişi Tamamla
        </button>
      )}
    </div>
  );
}
