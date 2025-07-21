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

  const totalPrice = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.qty, 0),
    [items]
  );

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

  // 0) Önce auth loading & kontrol
  if (authLoading) {
    return <div className="text-center p-4">Yükleniyor…</div>;
  }
  if (!isLoggedIn) {
    alert("Ödeme yapabilmek için önce giriş yapmalısınız.");
    return <Navigate to="/auth" replace />;
  }

  // 1) Sepet boşsa ve form da yoksa cart’a dön
  if (items.length === 0 && !htmlContent) {
    return <Navigate to="/cart" replace />;
  }

  // 2) Eğer form HTML’i geldiyse, gömülü kapsayıcıyı render et
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

  // ─── Normal ödeme özeti ekranı
  const handlePayment = async () => {
    setLoading(true);
    try {
      const { data: html } = await api.post(
        "/payment/create-redirect",
        { cartItems: items, totalPrice },
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
        <div className="flex justify-between text-lg font-semibold border-t pt-4">
          <span>Toplam:</span>
          <span>₺{totalPrice.toFixed(2)}</span>
        </div>
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
