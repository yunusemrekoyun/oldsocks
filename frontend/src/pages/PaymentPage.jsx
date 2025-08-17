import React, { useEffect, useRef, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../context/useCart";
import api from "../../api";

const SESSION_KEY = "iyzicoCheckoutHtml";
const RELOAD_FLAG = "iyzicoReloadOnce";

export default function PaymentPage() {
  const containerRef = useRef(null);
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
  const selectedAddress = useMemo(() => {
    if (!addresses.length) return null;
    return (
      addresses.find((a) => a._id === selectedAddressIdFromState) ||
      addresses[0]
    );
  }, [addresses, selectedAddressIdFromState]);

  const [html, setHtml] = useState("");
  const [nonce, setNonce] = useState(0);

  const conversationId = location.state?.conversationId;

  // HTML getir (backend’den inline endpoint)
  useEffect(() => {
    if (!conversationId) {
      navigate("/cart", { replace: true });
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const { data } = await api.get(`/payment/inline/${conversationId}`, {
          responseType: "text",
        });
        if (cancelled) return;
        setHtml(data);
        sessionStorage.setItem(SESSION_KEY, data);
      } catch (e) {
        console.error("Ödeme formu yüklenemedi:", e);
        alert("Ödeme başlatılamadı. Lütfen tekrar deneyin.");
        navigate("/cart", { replace: true });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [conversationId, navigate]);

  // Adresleri getir
  useEffect(() => {
    api
      .get("/users/me/addresses")
      .then(({ data }) => setAddresses(data || []))
      .finally(() => setAddrLoading(false));
  }, []);

  // Formu DOM’a bas + script’leri yeniden çalıştır
  useEffect(() => {
    if (!html || !containerRef.current) return;

    const el = containerRef.current;
    el.innerHTML = html;

    const scripts = Array.from(el.querySelectorAll("script"));
    scripts.forEach((old) => {
      const s = document.createElement("script");
      Array.from(old.attributes).forEach((attr) =>
        s.setAttribute(attr.name, attr.value)
      );
      if (old.src) s.src = old.src;
      else s.textContent = old.innerHTML;
      old.parentNode?.replaceChild(s, old);
    });

    const t = setTimeout(() => {
      const hasForm = el.querySelector("form") || el.querySelector("iframe");
      const already = sessionStorage.getItem(RELOAD_FLAG);
      if (!hasForm && !already) {
        sessionStorage.setItem(RELOAD_FLAG, "1");
        window.location.reload();
      } else {
        sessionStorage.removeItem(RELOAD_FLAG);
      }
    }, 1000);

    return () => clearTimeout(t);
  }, [html, nonce]);

  // Geri gelince tekrar inject et
  useEffect(() => {
    const onPageShow = (e) => {
      const el = containerRef.current;
      const hasForm =
        el && (el.querySelector("form") || el.querySelector("iframe"));
      const cached = sessionStorage.getItem(SESSION_KEY);
      const already = sessionStorage.getItem(RELOAD_FLAG);

      if ((!hasForm || e?.persisted) && cached && !already) {
        sessionStorage.setItem(RELOAD_FLAG, "1");
        window.location.reload();
        return;
      }
      sessionStorage.removeItem(RELOAD_FLAG);
      setNonce((n) => n + 1);
    };

    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  return (
    <div className="min-h-screen bg-light1 text-dark1 py-8 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SOL: Ödeme Formu */}
        <section className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-md p-4 sm:p-6">
            <header className="mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-semibold">Ödeme</h2>
              <p className="text-sm text-gray-500 mt-1">
                Kart bilgilerinizi güvenle İyzico formu üzerinden girin.
              </p>
            </header>

            <div className="w-full flex justify-start">
              <div className="w-full max-w-[640px] rounded-xl border border-gray-200 p-3 sm:p-4 bg-white">
                <div
                  ref={containerRef}
                  id="iyzipay-checkout-form"
                  className="w-full min-h-[520px]"
                />
              </div>
            </div>
          </div>
        </section>

        {/* SAĞ: Sipariş Özeti + Adres */}
        <aside className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-md p-4 sm:p-6 lg:sticky lg:top-6">
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
