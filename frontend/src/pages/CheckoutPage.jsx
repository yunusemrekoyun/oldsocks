import React, { useState, useMemo, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useCart } from "../context/useCart";
import { useAuth } from "../context/AuthContext";
import AuthRequiredModal from "../components/auth/AuthRequireModal";
import api from "../../api";

export default function CheckoutPage() {
  const { items } = useCart();
  const { isLoggedIn, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [addrLoading, setAddrLoading] = useState(true);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const totalPrice = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.qty, 0),
    [items]
  );

  useEffect(() => {
    api
      .get("/users/me/addresses")
      .then(({ data }) => {
        setAddresses(data);
        if (data.length) setSelectedAddress(data[0]._id);
      })
      .finally(() => setAddrLoading(false));
  }, []);

  if (authLoading) return <div className="p-4">Yükleniyor…</div>;

  if (!isLoggedIn) {
    return (
      <AuthRequiredModal
        open
        onClose={() => navigate(-1)}
        onLogin={() => navigate("/profile")}
      />
    );
  }

  if (items.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  if (addrLoading) return <div className="p-4">Adresler yükleniyor…</div>;

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

  const attemptPayment = async (useFallback = false) => {
    if (!selectedAddress) {
      alert("Lütfen bir adres seçin.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/payment/start", {
        cartItems: items,
        totalPrice,
        addressId: selectedAddress,
        useFallback,
      });

      if (data?.missing && !useFallback) {
        return attemptPayment(true);
      }

      if (data?.conversationId) {
        // ✅ PaymentPage’e yönlendiriyoruz, orada embed edilecek
        navigate("/payment", {
          state: { conversationId: data.conversationId },
        });
        return;
      }

      alert("Ödeme başlatılamadı.");
    } catch (err) {
      console.error("Ödeme başlatılamadı:", err);
      if (err.response?.status === 401) {
        setShowLoginModal(true);
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
          onClick={() => attemptPayment(false)}
          disabled={loading}
          className={`mt-6 w-full py-3 rounded text-white transition ${
            loading ? "bg-gray-400" : "bg-dark1 hover:bg-dark2"
          }`}
        >
          {loading ? "Yönlendiriliyor…" : "Öde"}
        </button>
      </div>

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
