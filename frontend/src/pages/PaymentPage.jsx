// src/pages/PaymentPage.jsx
import React, { useEffect, useRef, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../context/useCart";
import api from "../../api";

export default function PaymentPage() {
  const containerRef = useRef(null);
  const startedForConvRef = useRef(null); // <-- aynı conversation için sadece bir kez çalış
  const iframeAppendedRef = useRef(false); // <-- birden fazla iframe oluşturmayı engelle

  const location = useLocation();
  const navigate = useNavigate();

  const { items } = useCart();
  const totalPrice = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.qty, 0),
    [items]
  );

  const [addresses, setAddresses] = useState([]);
  const [addrLoading, setAddrLoading] = useState(true);

  const selectedAddressIdFromState = location.state?.selectedAddress || null;
  const conversationId = location.state?.conversationId;

  useEffect(() => {
    if (!conversationId) navigate("/cart", { replace: true });
  }, [conversationId, navigate]);

  useEffect(() => {
    api
      .get("/users/me/addresses")
      .then(({ data }) => setAddresses(data || []))
      .finally(() => setAddrLoading(false));
  }, []);

  const selectedAddress = useMemo(() => {
    if (!addresses.length) return null;
    return (
      addresses.find((a) => a._id === selectedAddressIdFromState) ||
      addresses[0]
    );
  }, [addresses, selectedAddressIdFromState]);

  useEffect(() => {
    // StrictMode ikinci mount’ta bu guard devreye girsin
    if (!conversationId) return;
    if (startedForConvRef.current === conversationId) return; // zaten başlatıldı
    startedForConvRef.current = conversationId;

    let alive = true;

    (async () => {
      try {
        const { data } = await api.get(`/payment/inline/${conversationId}`, {
          params: { t: Date.now() },
        });
        if (!alive) return;

        const host = containerRef.current;
        if (!host) return;

        // Yalnızca ilk kez temizle+yerleştir
        if (!iframeAppendedRef.current) host.innerHTML = "";

        if (data?.mode === "mock" && typeof data.html === "string") {
          if (iframeAppendedRef.current) return;
          host.innerHTML = data.html;
          iframeAppendedRef.current = true;
          return;
        }

        if (data?.mode === "paytr" && data.token) {
          if (iframeAppendedRef.current) return; // ikinci kez iframe oluşturma
          const iframe = document.createElement("iframe");
          iframe.id = "paytriframe";
          iframe.src = `https://www.paytr.com/odeme/guvenli/${
            data.token
          }?t=${Date.now()}`;
          iframe.frameBorder = "0";
          iframe.scrolling = "auto";
          iframe.style.width = "100%";
          iframe.style.minHeight = "1100px";
          iframe.style.display = "block";
          iframe.style.border = "0";
          host.appendChild(iframe);
          iframeAppendedRef.current = true;
          return;
        }

        console.error("Bilinmeyen inline response:", data);
        alert("Ödeme başlatılamadı. Lütfen tekrar deneyin.");
        navigate("/cart", { replace: true });
      } catch (e) {
        console.error("Ödeme formu yüklenemedi:", e);
        alert("Ödeme başlatılamadı. Lütfen tekrar deneyin.");
        navigate("/cart", { replace: true });
      }
    })();

    return () => {
      alive = false;
      // Unmount’ta iframe’i silme — StrictMode’un ikinci ‘unmount/mount’ döngüsünde
      // token’ı tekrar yükleyip 429’a düşmemek için DOM’u koruyoruz.
      // Sayfadan ayrılırken otomatik resetlenmesi için:
      if (location.pathname !== "/payment") {
        const host = containerRef.current;
        if (host) host.innerHTML = "";
        iframeAppendedRef.current = false;
        startedForConvRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]); // navigate'ı dependency'ye eklemiyoruz

  return (
    <div className="min-h-screen bg-light1 text-dark1 py-6 sm:py-8 px-3 sm:px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-md p-4 sm:p-6">
            <header className="mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-semibold">Ödeme</h2>
              <p className="text-sm text-gray-500 mt-1">
                Kart bilgilerinizi güvenle PayTR formu üzerinden girin.
              </p>
            </header>
            <div className="w-full">
              <div
                key={conversationId}
                className="w-full mx-auto rounded-xl border border-gray-200 p-3 sm:p-4 bg-white max-w-[720px]"
              >
                <div
                  ref={containerRef}
                  id="paytr-inline-container"
                  className="w-full min-h-[1000px] lg:min-h-[1100px]"
                />
              </div>
            </div>
          </div>
        </section>

        <aside className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-md p-4 sm:p-6 xl:sticky xl:top-6">
            <h3 className="text-lg font-semibold mb-4">Sipariş Özeti</h3>
            <ul className="space-y-3 max-h-72 overflow-auto pr-1">
              {items.map((it, i) => (
                <li
                  key={`${it.id || it._id || i}-${i}`}
                  className="flex justify-between items-start bg-light2/60 rounded-lg p-3"
                >
                  <div className="mr-3">
                    <p className="font-medium text-sm sm:text-base">
                      {it.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      Adet: {it.qty} × ₺{it.price?.toFixed?.(2) || it.price}
                    </p>
                    {it.size && (
                      <p className="text-xs text-gray-600">Beden: {it.size}</p>
                    )}
                    {it.color && (
                      <p className="text-xs text-gray-600">Renk: {it.color}</p>
                    )}
                  </div>
                  <div className="font-semibold text-sm sm:text-base whitespace-nowrap">
                    ₺{(it.price * it.qty).toFixed(2)}
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex justify-between items-center text-base sm:text-lg font-semibold border-t pt-4 mt-4">
              <span>Toplam</span>
              <span>₺{totalPrice.toFixed(2)}</span>
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Gönderim Adresi
              </h4>
              {addrLoading ? (
                <div className="text-sm text-gray-500">
                  Adresler yükleniyor…
                </div>
              ) : selectedAddress ? (
                <div className="text-sm bg-light2/60 p-3 rounded-lg leading-6">
                  <div className="font-medium">{selectedAddress.title}</div>
                  <div>{selectedAddress.mainaddress}</div>
                  <div>
                    {selectedAddress.district
                      ? `${selectedAddress.district}, `
                      : ""}
                    {selectedAddress.city}
                  </div>
                  {selectedAddress.postalCode && (
                    <div>PK: {selectedAddress.postalCode}</div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  Kayıtlı adres bulunamadı.
                </div>
              )}

              <button
                type="button"
                onClick={() => navigate("/profile")}
                className="mt-3 w-full text-center text-sm bg-dark1 hover:bg-dark2 text-white rounded-lg py-2 transition"
              >
                Adresleri Yönet
              </button>
            </div>

            <p className="text-[12px] text-gray-500 mt-4">
              Ödeme sırasında sayfayı kapatmayın veya geri tuşuna basmayın.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
