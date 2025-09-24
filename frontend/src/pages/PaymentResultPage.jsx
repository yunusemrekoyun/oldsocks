// src/pages/PaymentResultPage.jsx
import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useCart } from "../context/useCart";
import api from "../../api";

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();

  const status = searchParams.get("status"); // "success" | "failure"
  const merchantOid = searchParams.get("merchant_oid");
  const conversationId =
    merchantOid ||
    searchParams.get("conversationId") ||
    searchParams.get("conversation_id");

  const paymentId = searchParams.get("paymentId");

  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const [orderNumber, setOrderNumber] = useState("");

  const unmounted = useRef(false);
  const timers = useRef([]);

  useEffect(() => {
    // StrictMode'da ikinci mount'a girerken resetle
    unmounted.current = false;
    return () => {
      unmounted.current = true;
      timers.current.forEach(clearTimeout);
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

    if (status === "failure") {
      const rawMsg = searchParams.get("message") || "Ödeme başarısız.";
      setMessage(decode(rawMsg));
      setLoaded(true);
      return;
    }

    if (status === "success" && conversationId) {
      let attempts = 0;
      const maxAttempts = 7;
      const delayMs = 1500;

      const finishAsSuccess = (maybeOrderNo) => {
        if (unmounted.current) return;
        if (maybeOrderNo) setOrderNumber(maybeOrderNo);
        setMessage("Siparişiniz başarıyla kaydedildi!");
        clearCart();
        setLoaded(true);
      };

      const finishAsError = (msg) => {
        if (unmounted.current) return;
        setMessage(msg || "Sipariş kaydı sırasında bir hata oluştu.");
        setLoaded(true);
      };

      const tryConfirm = async () => {
        try {
          const res = await api.post("/orders/confirm", { conversationId });
          // Başarı: orderNumber olsa da olmasa da başarı ekranına geç
          const no = res?.data?.orderNumber;
          finishAsSuccess(no);
        } catch (err) {
          const code = err?.response?.status;
          if (code === 409 && attempts < maxAttempts) {
            attempts += 1;
            const t = setTimeout(tryConfirm, delayMs);
            timers.current.push(t);
            return;
          }
          // Diğer hatalarda hata ekranı
          finishAsError();
        }
      };

      (async () => {
        // MOCK ise önce backend’e tek sefer “paid” dedirtip sonra confirm et
        if (paymentId && paymentId.startsWith("mock_")) {
          try {
            await api.post("/payment/mock-complete", { conversationId });
          } catch {
            // önemli değil; confirm polling yine deneyecek
          }
        }

        // 12 sn watchdog: hiçbir şeye düşemezse spinner’ı sonlandır
        const watchdog = setTimeout(() => {
          finishAsError(
            "Onay beklenenden uzun sürdü. Siparişiniz oluşturulduysa 'Hesabım → Siparişlerim'den görebilirsiniz."
          );
        }, 12000);
        timers.current.push(watchdog);

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
