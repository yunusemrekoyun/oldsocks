import React, { useState, useMemo, useEffect, useRef } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useCart } from "../context/useCart";
import { useAuth } from "../context/AuthContext";
import AuthRequiredModal from "../components/auth/AuthRequireModal";
import api from "../../api";

export default function CheckoutPage() {
  /* ─────────── State / context ─────────── */
  const { items } = useCart();
  const { isLoggedIn, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [htmlContent, setHtmlContent] = useState(null);
  const containerRef = useRef(null);

  const [addresses, setAddresses] = useState([]);
  const [addrLoading, setAddrLoading] = useState(true);
  const [selectedAddress, setSelectedAddress] = useState(null);

  const [showLoginModal, setShowLoginModal] = useState(false);

  /* ─────────── Hesaplamalar ─────────── */
  const totalPrice = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.qty, 0),
    [items]
  );

  /* ─────────── Etkiler ─────────── */
  // 1) Kullanıcının adreslerini getir
  useEffect(() => {
    api
      .get("/users/me/addresses")
      .then(({ data }) => {
        setAddresses(data);
        if (data.length) setSelectedAddress(data[0]._id);
      })
      .finally(() => setAddrLoading(false));
  }, []);

  // 2) İyzico’nun döndürdüğü formu DOM’a yerleştir
  useEffect(() => {
    if (!htmlContent) return;
    const c = containerRef.current;
    c.innerHTML = htmlContent;

    Array.from(c.querySelectorAll("script")).forEach((old) => {
      const s = document.createElement("script");
      old.src ? (s.src = old.src) : (s.textContent = old.innerHTML);
      document.head.appendChild(s);
    });
  }, [htmlContent]);

  /* ─────────── Erken dönüş kontrolleri ─────────── */
  if (authLoading) return <div className="p-4">Yükleniyor…</div>;

  // Kullanıcı login değil → modal
  if (!isLoggedIn) {
    return (
      <AuthRequiredModal
        open
        onClose={() => navigate(-1)} // çarpı → önceki sayfa
        onLogin={() => navigate("/profile")} // giriş → /profile
      />
    );
  }

  // Sepet boşsa
  if (!htmlContent && items.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  if (addrLoading) return <div className="p-4">Adresler yükleniyor…</div>;

  // Kullanıcının hiç adresi yok
  if (addresses.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <p className="mb-4">
          Ödeme yapabilmek için önce bir adres eklemeniz gerekiyor.
        </p>
        <button
          onClick={() => navigate("/profile")}
          className="px-4 py-2 bg-dark1 text-white rounded"
        >
          Adres Ekle
        </button>
      </div>
    );
  }

  /* ─────────── Ödeme denemesi ─────────── */
  const attemptPayment = async (useFallback = false) => {
    if (!selectedAddress) {
      alert("Lütfen bir adres seçin.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(
        "/payment/create-redirect",
        {
          cartItems: items,
          totalPrice,
          addressId: selectedAddress,
          useFallback,
        },
        { responseType: "text" }
      );

      // 206 → eksik bilgi fallback
      if (response.status === 206) {
        const { missing } = JSON.parse(response.data);
        if (
          window.confirm(
            `Aşağıdaki müşteri bilgileri eksik: ${missing.join(
              ", "
            )}. Fallback verileri kullanılsın mı?`
          )
        ) {
          return attemptPayment(true);
        } else {
          alert("Lütfen profilinizden eksik bilgileri tamamlayın.");
          return;
        }
      }

      // 200 → form HTML’i
      setHtmlContent(response.data);
    } catch (err) {
      console.error("Ödeme başlatılamadı:", err);
      // Token süresi dolduysa
      if (err.response?.status === 401) {
        setShowLoginModal(true);
      } else {
        alert("Ödeme başlatılamadı. Lütfen tekrar deneyin.");
      }
    } finally {
      setLoading(false);
    }
  };

  /* ─────────── Form embed edildiyse ─────────── */
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

  /* ─────────── Normal ödeme sayfası ─────────── */
  return (
    <div className="min-h-screen bg-light1 text-dark1 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">Ödeme Özeti</h2>

        {/* Adres seçimi */}
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

        {/* Ürünler */}
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

        {/* Öde */}
        <button
          onClick={() => attemptPayment(false)}
          disabled={loading}
          className={`mt-6 w-full py-3 rounded text-white transition ${
            loading ? "bg-gray-400" : "bg-dark1 hover:bg-dark2"
          }`}
        >
          {loading ? "Yönlendiriliyor…" : "Iyzico ile Öde"}
        </button>
      </div>

      {/* 401 durumunda açılan modal */}
      {showLoginModal && (
        <AuthRequiredModal
          open
          onClose={() => setShowLoginModal(false)}
          onLogin={() => navigate("/profile")}
        />
      )}
    </div>
  );
}
