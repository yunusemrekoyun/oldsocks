// src/pages/CheckoutPage.jsx
import React, { useState, useMemo, useEffect, useRef } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useCart } from "../context/useCart";
import { useAuth } from "../context/AuthContext";
import api from "../../api";

export default function CheckoutPage() {
  // ─── TÜM HOOK’LAR BURADA:
  const { items, clearCart } = useCart();
  const { isLoggedIn, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [htmlContent, setHtmlContent] = useState(null);
  const containerRef = useRef(null);

  // Yeni: adresleri çekmek için state’ler
  const [addresses, setAddresses] = useState([]);
  const [addrLoading, setAddrLoading] = useState(true);

  const [selectedAddress, setSelectedAddress] = useState(null);

  const totalPrice = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.qty, 0),
    [items]
  );

  // Adresleri yükle
  useEffect(() => {
    api
      .get("/users/me/addresses")
      .then(({ data }) => {
        setAddresses(data);
        if (data.length > 0) {
          setSelectedAddress(data[0]._id);
        }
      })
      .catch(() => {
        setAddresses([]);
      })
      .finally(() => setAddrLoading(false));
  }, []);

  // Iyzico gömülü form script’lerini çalıştır
  useEffect(() => {
    if (!htmlContent) return;
    const c = containerRef.current;
    c.innerHTML = htmlContent;
    Array.from(c.querySelectorAll("script")).forEach((old) => {
      const s = document.createElement("script");
      if (old.src) s.src = old.src;
      else s.textContent = old.innerHTML;
      document.head.appendChild(s);
    });
  }, [htmlContent]);

  // ─── KOŞULLU RENDER BLOKLARI:

  // 0) Auth yükleniyorsa
  if (authLoading) {
    return <div className="text-center p-4">Yükleniyor…</div>;
  }
  // 1) Girişli değilse
  if (!isLoggedIn) {
    alert("Ödeme yapabilmek için önce giriş yapmalısınız.");
    return <Navigate to="/auth" replace />;
  }
  // 2) Sepet boşsa ve form da yoksa cart’a dön
  if (items.length === 0 && !htmlContent) {
    return <Navigate to="/cart" replace />;
  }
  // 3) Gömülü Iyzico formu varsa
  if (htmlContent) {
    return (
      <div className="min-h-screen bg-light1 text-dark1 py-10 px-4">
        <div
          ref={containerRef}
          className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-6"
        />
      </div>
    );
  }

  // 4) Adresler yüklenirken bekle
  if (addrLoading) {
    return <div className="text-center p-4">Adresler yükleniyor…</div>;
  }
  // 5) Adres yoksa adres ekleme sayfasına yönlendir
  if (addresses.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <p className="mb-4">
          Ödeme yapabilmek için önce bir adres eklemeniz gerekiyor.
        </p>
        <button
          onClick={() => navigate("/auth")}
          className="px-4 py-2 bg-dark1 text-white rounded hover:bg-dark2"
        >
          Adres Ekle
        </button>
      </div>
    );
  }

  // ─── Normal ödeme özeti ekranı (adres seçimi dahil)
  const handlePayment = async () => {
    if (!selectedAddress) {
      alert("Lütfen bir adres seçin.");
      return;
    }
    setLoading(true);
    try {
      const { data: html } = await api.post(
        "/payment/create-redirect",
        { cartItems: items, totalPrice, addressId: selectedAddress },
        { responseType: "text" }
      );
      clearCart();
      setHtmlContent(html);
    } catch (err) {
      console.error("Ödeme başlatılamadı:", err);
      if (err.response?.status === 401) {
        alert("Oturumunuz sona ermiş. Lütfen tekrar giriş yapın.");
        navigate("/auth");
      } else {
        alert("Ödeme başlatılamadı. Lütfen tekrar deneyin.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-light1 text-dark1 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">Ödeme Özeti</h2>

        {/* Yeni: Adres seçimi */}
        <div className="mb-6">
          <h3 className="font-medium mb-2">Gönderim Adresi</h3>
          <fieldset className="space-y-2">
            {addresses.map((addr) => (
              <label key={addr._id} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="addr"
                  value={addr._id}
                  checked={selectedAddress === addr._id}
                  onChange={() => setSelectedAddress(addr._id)}
                  className="form-radio"
                />
                <span>
                  {addr.title} — {addr.mainaddress}, {addr.city}
                </span>
              </label>
            ))}
          </fieldset>
        </div>

        {/* Ürün özeti */}
        <ul className="space-y-3 mb-6">
          {items.map((it, i) => (
            <li
              key={i}
              className="flex justify-between items-center bg-light2 p-3 rounded"
            >
              <div>
                <p className="font-medium">{it.name}</p>
                {it.size && (
                  <p className="text-sm text-gray-600">Beden: {it.size}</p>
                )}
                <p className="text-sm text-gray-600">
                  Adet: {it.qty} × ₺{it.price.toFixed(2)}
                </p>
              </div>
              <div className="font-semibold">
                ₺{(it.price * it.qty).toFixed(2)}
              </div>
            </li>
          ))}
        </ul>

        {/* Toplam */}
        <div className="flex justify-between text-lg font-semibold border-t pt-4">
          <span>Toplam:</span>
          <span>₺{totalPrice.toFixed(2)}</span>
        </div>

        {/* Ödeme butonu */}
        <button
          onClick={handlePayment}
          disabled={loading}
          className={`mt-6 w-full py-3 rounded text-white transition ${
            loading ? "bg-gray-400" : "bg-dark1 hover:bg-dark2"
          }`}
        >
          {loading ? "Yönlendiriliyor…" : "Iyzico ile Öde"}
        </button>
      </div>
    </div>
  );
}
