// src/pages/PaymentResultPage.jsx
import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../../api";

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get("status"); // "success" veya "failure"
  const paymentId = searchParams.get("paymentId"); // sadece success’te gelir
  let conversationId = searchParams.get("conversationId");
  if (!conversationId) {
    conversationId = searchParams.get("conversation_id");
  }
  const rawMessage = searchParams.get("message"); // sadece failure’ta gelir
  const navigate = useNavigate();

  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (status === "success" && conversationId && paymentId) {
      // siparişi kaydetmek için backend'e bildir
      api
        .post("/orders/confirm", { conversationId, paymentId })
        .then(() => {
          setMessage("Siparişiniz başarıyla kaydedildi!");
        })
        .catch(() => {
          setMessage("Sipariş kaydı sırasında bir hata oluştu.");
        });
    } else if (status === "failure") {
      // Token eksik vb. hataları daha anlaşılır yap
      if (rawMessage?.includes("Token gönderilmesi")) {
        setMessage(
          "Ödeme servisine erişim sağlanamadı. Lütfen tekrar deneyin."
        );
      } else {
        setMessage(decodeURIComponent(rawMessage || ""));
      }
    }
    setLoaded(true);
  }, [status, rawMessage, conversationId, paymentId]);

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
          <p className="mb-2">Ödeme Numaranız: {paymentId}</p>
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
