// src/components/cart/CartItem.jsx
import React, { useEffect, useState, useRef } from "react";
import { useCart } from "../../context/useCart";
import { FaTrash, FaPlus, FaMinus } from "react-icons/fa";
import { Link } from "react-router-dom";
import api from "../../../api";
import { formatTry } from "../../utils/currency";

export default function CartItem({ item }) {
  const { removeFromCart, addToCart, updateQty } = useCart?.() || {};
  const [maxStock, setMaxStock] = useState(Infinity);
  const [loadingStock, setLoadingStock] = useState(true);
  const [warn, setWarn] = useState("");
  const warnRef = useRef(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoadingStock(true);
        const { data } = await api.get(`/products/${item.id}`);
        if (!alive) return;
        const sizes = Array.isArray(data?.sizes) ? data.sizes : [];
        if (sizes.length === 0) {
          setMaxStock(Infinity);
        } else {
          const row = sizes.find((s) => s.size === item.size);
          const stock = Number(row?.stock ?? 0);
          setMaxStock(stock > 0 ? stock : 0);
        }
      } catch (e) {
        console.error("Stok bilgisi alınamadı:", e);
        setMaxStock(Infinity);
      } finally {
        if (alive) setLoadingStock(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [item.id, item.size]);

  const showWarn = (msg) => {
    if (warnRef.current) return;
    setWarn(msg);
    warnRef.current = true;
    setTimeout(() => {
      setWarn("");
      warnRef.current = false;
    }, 1800);
  };

  const setQtySafe = (nextQty) => {
    if (typeof updateQty === "function") {
      updateQty(item.id, item.size, nextQty);
    } else {
      removeFromCart(item.id, item.size);
      addToCart({
        id: item.id,
        name: item.name,
        image: item.image,
        price: item.price,
        size: item.size,
        color: item.color,
        qty: nextQty,
      });
    }
  };

  const inc = () => {
    if (maxStock !== Infinity && item.qty + 1 > maxStock) {
      showWarn(
        `Bu ürün için en fazla ${maxStock} adet ekleyebilirsiniz${
          item.size ? ` (Beden: ${item.size})` : ""
        }.`
      );
      return;
    }
    setQtySafe(item.qty + 1);
  };

  const dec = () => {
    if (item.qty <= 1) return;
    setQtySafe(item.qty - 1);
  };

  const outOfStock = !loadingStock && maxStock !== Infinity && maxStock === 0;

  return (
    <div className="bg-white rounded-xl shadow-md transition hover:shadow-lg">
      {/* Üst içerik */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-5">
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
            {item.color && (
              <p className="text-sm text-gray-500">Renk: {item.color}</p>
            )}

            {/* TOPLAM STOK GÖSTERİMİ KALDIRILDI */}
            {!loadingStock && outOfStock && (
              <p className="mt-1 text-[12px] text-red-600">Stokta yok</p>
            )}
          </div>
        </div>

        {/* Orta: Qty + Fiyat */}
        <div className="flex flex-col-reverse sm:flex-row items-center gap-3 sm:gap-6 w-full sm:w-auto">
          {/* Adet kontrolü */}
          <div className="flex items-center">
            <button
              onClick={dec}
              disabled={item.qty <= 1 || outOfStock}
              className="p-2 border border-light2 rounded-l-lg hover:bg-light1 transition disabled:opacity-40"
              aria-label="Adeti azalt"
            >
              <FaMinus className="text-dark2" />
            </button>
            <input
              type="text"
              readOnly
              value={item.qty}
              className="w-16 text-center border-t border-b border-light2 text-dark1 px-2 bg-white"
              aria-label="Adet"
            />
            <button
              onClick={inc}
              disabled={outOfStock}
              className="p-2 border border-light2 rounded-r-lg hover:bg-light1 transition disabled:opacity-40"
              aria-label="Adeti artır"
            >
              <FaPlus className="text-dark2" />
            </button>
          </div>

          {/* Fiyat bilgileri */}
          <div className="flex flex-col items-start sm:items-end text-sm sm:text-base gap-1 w-full sm:w-auto">
            <p className="text-gray-600">
              Fiyat:{" "}
              <span className="text-dark1 font-medium">
                {formatTry(item.price)}
              </span>
            </p>
            <p className="text-dark1 font-semibold">
              Toplam: {formatTry(Number(item.price) * Number(item.qty))}
            </p>
          </div>
        </div>

        {/* Sağ: Kaldır */}
        <button
          onClick={() => removeFromCart(item.id, item.size)}
          className="text-red-600 hover:text-red-700 transition"
          aria-label="Ürünü sepetten kaldır"
          title="Ürünü sepetten kaldır"
        >
          <FaTrash size={18} />
        </button>
      </div>

      {/* Alt: sabit yükseklikli uyarı bandı */}
      <div
        className={`px-4 pb-3 -mt-2 text-[13px] text-red-600 transition-opacity duration-200 ${
          warn ? "opacity-100" : "opacity-0"
        }`}
        style={{ minHeight: 20 }}
        aria-live="polite"
      >
        {warn || "."}
      </div>
    </div>
  );
}
