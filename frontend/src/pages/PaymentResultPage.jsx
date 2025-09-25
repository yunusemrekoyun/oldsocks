/* eslint-disable no-empty */
// src/pages/PaymentResultPage.jsx
import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useCart } from "../context/useCart";
import api from "../../api";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";

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

  // guard & timers
  const timers = useRef([]);
  const doneRef = useRef(false);
  const attemptsRef = useRef(0);

  const clearAllTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  useEffect(() => {
    return () => {
      doneRef.current = true;
      clearAllTimers();
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
      const onceKey = `confirm:${conversationId}`;
      const lockKey = `__CONFIRM_LOCK__:${conversationId}`;
      const state = sessionStorage.getItem(onceKey);
      if (state === "done") {
        setMessage("Siparişiniz başarıyla kaydedildi.");
        setLoaded(true);
        return;
      }

      if (window[lockKey]) {
        if (!loaded) setLoaded(false);
        return;
      }
      window[lockKey] = true;
      if (state !== "started") sessionStorage.setItem(onceKey, "started");

      doneRef.current = false;
      attemptsRef.current = 0;

      const finishAsSuccess = (maybeOrderNo) => {
        if (doneRef.current) return;
        doneRef.current = true;
        if (maybeOrderNo) setOrderNumber(maybeOrderNo);
        setMessage("Siparişiniz başarıyla kaydedildi.");
        try {
          clearCart();
        } catch {}
        sessionStorage.setItem(onceKey, "done");
        clearAllTimers();
        setLoaded(true);
      };

      const finishAsError = (msg) => {
        if (doneRef.current) return;
        doneRef.current = true;
        setMessage(msg || "Sipariş kaydı sırasında bir hata oluştu.");
        clearAllTimers();
        setLoaded(true);
      };

      const tryConfirm = async () => {
        if (doneRef.current) return;
        try {
          const res = await api.post("/orders/confirm", { conversationId });
          const no = res?.data?.orderNumber;
          finishAsSuccess(no);
        } catch (err) {
          if (doneRef.current) return;
          const code = err?.response?.status;
          const attempt = attemptsRef.current;
          const maxAttempts = 7;
          if (code === 409 && attempt < maxAttempts) {
            attemptsRef.current = attempt + 1;
            const delayMs = 1500 + attempt * 500;
            const t = setTimeout(tryConfirm, delayMs);
            timers.current.push(t);
            return;
          }
          finishAsError(
            code === 409
              ? "Onay beklenenden uzun sürdü. Siparişiniz oluşturulduysa 'Hesabım → Siparişlerim'den görebilirsiniz."
              : undefined
          );
        }
      };

      (async () => {
        if (paymentId && paymentId.startsWith("mock_")) {
          try {
            await api.post("/payment/mock-complete", { conversationId });
          } catch {}
        }
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

    setMessage("Geçersiz geri dönüş parametreleri.");
    setLoaded(true);
  }, [status, conversationId, paymentId, loaded]);

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
        <p className="text-lg font-medium text-gray-700 animate-pulse">
          Sonuç alınıyor…
        </p>
      </div>
    );
  }

  const isSuccess = status === "success";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 px-4 py-10">
      <div className="w-full max-w-lg bg-white shadow-2xl rounded-2xl p-8 text-center">
        {isSuccess ? (
          <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto mb-6 drop-shadow" />
        ) : (
          <XCircleIcon className="w-20 h-20 text-red-500 mx-auto mb-6 drop-shadow" />
        )}

        <h2
          className={`text-3xl font-bold mb-3 ${
            isSuccess ? "text-green-600" : "text-red-600"
          }`}
        >
          {isSuccess ? "Ödeme Başarılı" : "Ödeme Başarısız"}
        </h2>

        {paymentId && (
          <p className="text-sm text-gray-500 mb-1">Ödeme No: {paymentId}</p>
        )}
        {orderNumber && (
          <p className="text-sm text-gray-500 mb-3">
            Sipariş No: <strong>{orderNumber}</strong>
          </p>
        )}
        {message && <p className="text-gray-700 mb-6">{message}</p>}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex-1 py-3 bg-dark1 text-white rounded-lg shadow-md hover:bg-dark2 transition"
          >
            Ana Sayfa
          </button>
          {isSuccess && (
            <button
              onClick={() => navigate("/profile", { state: { tab: "orders" } })}
              className="flex-1 py-3 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition"
            >
              Siparişlerim
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
