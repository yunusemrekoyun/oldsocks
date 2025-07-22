// src/pages/PaymentResultPage.jsx
import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../../api";

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get("status");
  const paymentId = searchParams.get("paymentId");
  // hem camelCase hem snake_case yakalayalım
  const conversationId =
    searchParams.get("conversationId") || searchParams.get("conversation_id");
  const navigate = useNavigate();

  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const [orderNumber, setOrderNumber] = useState("");

  useEffect(() => {
    if (status === "success" && paymentId && conversationId) {
      api
        .post("/orders/confirm", { conversationId, paymentId })
        .then((res) => {
          setOrderNumber(res.data.orderNumber);
          setMessage("Siparişiniz başarıyla kaydedildi!");
        })
        .catch((err) => {
          console.error("Sipariş onaylama hatası:", err);
          setMessage("Sipariş kaydı sırasında bir hata oluştu.");
        });
    } else if (status === "failure") {
      const raw = searchParams.get("message") || "";
      setMessage(decodeURIComponent(raw));
    }
    setLoaded(true);
  }, [status, paymentId, conversationId, searchParams]);

  if (!loaded) return <div className="text-center p-10">Sonuç alınıyor…</div>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      {status === "success" ? (
        <>
          <h2 className="text-3xl font-bold text-green-600 mb-4">
            Ödeme Başarılı 🎉
          </h2>
          <p className="mb-2">Ödeme Numaranız: {paymentId}</p>
          {orderNumber && (
            <p className="mb-4">
              Sipariş Numaranız:{" "}
              <span className="font-semibold">{orderNumber}</span>
            </p>
          )}
          {message && <p className="text-center max-w-md mb-4">{message}</p>}
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
