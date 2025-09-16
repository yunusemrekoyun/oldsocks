// src/pages/PaymentResultPage.jsx
import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useCart } from "../context/useCart";
import api from "../../api";

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();

  // PayTR -> merchant_oid | Geriye dönük: conversationId / conversation_id
  const status = searchParams.get("status"); // "success" veya "failure"
  const merchantOid = searchParams.get("merchant_oid");
  const conversationId =
    merchantOid ||
    searchParams.get("conversationId") ||
    searchParams.get("conversation_id");

  // PayTR genelde paymentId göndermez; varsa gösteririz (opsiyonel)
  const paymentId = searchParams.get("paymentId");

  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const [orderNumber, setOrderNumber] = useState("");

  const unmounted = useRef(false);
  useEffect(() => {
    return () => {
      unmounted.current = true;
    };
  }, []);

  useEffect(() => {
    const decode = (s) => {
      try {
        return decodeURIComponent(s || "");
      } catch {
        return s || "";
      }
    };

    // Başarısız sonuç — sadece mesaj göster
    if (status === "failure") {
      const rawMsg = searchParams.get("message") || "Ödeme başarısız.";
      setMessage(decode(rawMsg));
      setLoaded(true);
      return;
    }

    // Başarılı dönüş — PayTR callback server’a düşmüş mü kontrol et
    if (status === "success" && conversationId) {
      (async () => {
        // 1) MOCK ise önce backend'e "tamamla" de (paid'e çek)
        if (paymentId && paymentId.startsWith("mock_")) {
          try {
            await api.post("/payment/mock-complete", { conversationId });
          } catch (e) {
            // Önemli değil; aşağıdaki confirm retry mekanizması zaten devrede
            console.warn("mock-complete çağrısı başarısız (önemsiz):", e);
          }
        }

        // 2) Ardından mevcut confirm retry akışı
        let attempts = 0;
        const maxAttempts = 7; // ~10-11 sn
        const delayMs = 1500;

        const tryConfirm = async () => {
          try {
            const res = await api.post("/orders/confirm", { conversationId });
            if (unmounted.current) return;
            setOrderNumber(res.data.orderNumber);
            setMessage("Siparişiniz başarıyla kaydedildi!");
            clearCart(); // yalnızca onay gerçekten alındığında temizle
            setLoaded(true);
          } catch (err) {
            const code = err?.response?.status;

            // 409 => callback henüz gelmedi; kısa bekleyip tekrar dene
            if (code === 409 && attempts < maxAttempts) {
              attempts += 1;
              setTimeout(tryConfirm, delayMs);
              return;
            }

            // Diğer hatalar
            if (unmounted.current) return;
            setMessage("Sipariş kaydı sırasında bir hata oluştu.");
            setLoaded(true);
          }
        };

        tryConfirm();
      })();

      return;
    }

    // Beklenmedik durum
    setMessage("Geçersiz geri dönüş parametreleri.");
    setLoaded(true);
  }, [status, conversationId, clearCart, searchParams, paymentId]);

  if (!loaded) {
    return <div className="text-center p-10">Sonuç alınıyor…</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      {status === "success" ? (
        <>
          <h2 className="text-3xl font-bold text-green-600 mb-4">
            Ödeme Başarılı 🎉
          </h2>
          {paymentId && <p className="mb-2">Ödeme Numaranız: {paymentId}</p>}
          {orderNumber && (
            <p className="mb-4">
              Sipariş Numaranız: <strong>{orderNumber}</strong>
            </p>
          )}
          {message && <p className="text-center max-w-md">{message}</p>}
        </>
      ) : (
        <>
          <h2 className="text-3xl font-bold text-red-600 mb-4">
            Ödeme Başarısız 😞
          </h2>
          <p className="text-center max-w-md">{message}</p>
        </>
      )}
      <button
        onClick={() => navigate("/")}
        className="mt-6 px-4 py-2 bg-dark1 text-white rounded hover:bg-dark2"
      >
        Ana Sayfa
      </button>
    </div>
  );
}
