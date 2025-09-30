// src/components/cart/Cart.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useCart } from "../../context/useCart";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import CartItem from "./CartItem";
import { FaShoppingCart } from "react-icons/fa";
import AuthRequiredModal from "../auth/AuthRequireModal";
import api from "../../../api";

export default function Cart() {
  const { items, clearCart } = useCart();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Tek onay (KVKK + sözleşme)
  const [consentChecked, setConsentChecked] = useState(false);

  // Kargo metodu (tek kayıt varsayımı)
  const [shipping, setShipping] = useState(null); // { _id, name, fee, freeShippingThreshold }
  const [shipLoading, setShipLoading] = useState(true);
  const [shipError, setShipError] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setShipLoading(true);
        const { data } = await api.get("/shipping");
        if (!alive) return;
        const list = Array.isArray(data) ? data : [];
        setShipping(list[0] || null);
        setShipError(null);
      } catch (e) {
        console.error("Kargo bilgisi alınamadı:", e);
        setShipError("Kargo bilgisi alınamadı");
        setShipping(null);
      } finally {
        if (alive) setShipLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Ara toplam
  const subTotal = useMemo(
    () => items.reduce((total, item) => total + item.price * item.qty, 0),
    [items]
  );

  // Ücretsiz kargo koşulu
  const isFree =
    shipping?.freeShippingThreshold != null &&
    subTotal >= Number(shipping.freeShippingThreshold);

  // Ödenecek kargo bedeli
  const payableShipping = !shipping
    ? 0
    : isFree
    ? 0
    : Number(shipping.fee || 0);

  // Genel toplam
  const grandTotal = subTotal + payableShipping;

  const handleCheckout = () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
    } else {
      navigate("/checkout");
    }
  };

  /* ─────────── sepet boş ─────────── */
  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-dark1 px-4 text-center">
        <FaShoppingCart size={60} className="mb-4 text-gray-400" />
        <h2 className="text-3xl font-semibold mb-2">Sepetiniz boş</h2>
        <p className="text-gray-500 mb-6">
          Alışverişe devam ederek favori ürünleri ekleyebilirsiniz.
        </p>
        <button
          onClick={() => navigate("/shop")}
          className="bg-dark1 text-white px-8 py-3 rounded-full hover:bg-dark2 transition"
        >
          Alışverişe Başla
        </button>
      </div>
    );
  }

  /* ─────────── normal sepet görünümü ─────────── */
  return (
    <div className="container mx-auto px-4 py-10">
      <h2 className="text-3xl sm:text-4xl font-bold text-dark1 mb-8 sm:mb-10 flex items-center gap-3">
        <FaShoppingCart className="text-dark2" size={26} />
        Sepetim
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Ürün listesi */}
        <section className="lg:col-span-2">
          <div className="space-y-4 sm:space-y-6">
            {items.map((item) => (
              <CartItem
                key={`${item.id}-${item.size || "nosize"}`}
                item={item}
              />
            ))}
          </div>
        </section>

        {/* Özet kartı */}
        <aside className="lg:col-span-1">
          <div className="lg:sticky lg:top-6 bg-white rounded-xl border border-light2 p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-dark1 mb-4">
              Sipariş Özeti
            </h3>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-dark2">Ara Toplam</span>
                <span className="font-medium">₺{subTotal.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-dark2">
                    Kargo{shipping?.name ? ` (${shipping.name})` : ""}
                  </span>
                  {shipLoading && (
                    <span className="text-xs text-gray-500">hesaplanıyor…</span>
                  )}
                  {shipError && (
                    <span className="text-xs text-red-600">{shipError}</span>
                  )}
                </div>

                {shipping ? (
                  isFree ? (
                    <div className="flex items-center gap-2">
                      <s className="text-gray-400">
                        ₺{Number(shipping.fee || 0).toFixed(2)}
                      </s>
                      <span className="font-medium">₺0.00</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                        Kargo ücretsiz
                      </span>
                    </div>
                  ) : (
                    <span className="font-medium">
                      ₺{Number(shipping.fee || 0).toFixed(2)}
                    </span>
                  )
                ) : (
                  <span className="font-medium">₺0.00</span>
                )}
              </div>

              {shipping?.freeShippingThreshold != null && !isFree && (
                <div className="text-xs text-gray-500 text-right">
                  ₺{Number(shipping.freeShippingThreshold).toFixed(0)} ve üzeri
                  alışverişlerde kargo ücretsiz.
                </div>
              )}
            </div>

            <div className="h-px bg-light2 my-4" />

            <div className="flex items-center justify-between text-base sm:text-lg font-semibold">
              <span>Genel Toplam</span>
              <span>₺{grandTotal.toFixed(2)}</span>
            </div>

            {/* Tek onay kutusu (KVKK + Sözleşme) */}
            <div className="mt-4 text-sm">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                />
                <span>
                  <a
                    href="/kvkk"
                    target="_blank"
                    className="text-primary underline"
                  >
                    KVKK Aydınlatma Metni
                  </a>{" "}
                  ve{" "}
                  <a
                    href="/agreement"
                    target="_blank"
                    className="text-primary underline"
                  >
                    Mesafeli Satış Sözleşmesi
                  </a>{" "}
                  ’ni okudum, onaylıyorum.
                </span>
              </label>
            </div>

            {/* Butonlar */}
            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <button
                onClick={clearCart}
                className="flex-1 sm:flex-none sm:min-w-[160px] bg-light2 text-dark2 px-5 py-3 rounded-full hover:bg-light1 transition font-medium"
              >
                Sepeti Temizle
              </button>
              <button
                onClick={handleCheckout}
                disabled={!consentChecked}
                className={`flex-1 sm:flex-none sm:min-w-[180px] px-6 py-3 rounded-full font-semibold transition ${
                  !consentChecked
                    ? "bg-gray-400 cursor-not-allowed text-white"
                    : "bg-dark1 text-white hover:bg-dark2"
                }`}
              >
                Ödeme Yap
              </button>
            </div>
          </div>
        </aside>
      </div>

      {showLoginModal && (
        <AuthRequiredModal
          open
          onClose={() => setShowLoginModal(false)}
          onLogin={() => navigate("/profile")}
          onGuest={() => {
            setShowLoginModal(false);
            navigate("/checkout-guest");
          }}
          title="Devam etmek için giriş yapın"
          message="Dilerseniz üye olmadan da devam edebilirsiniz."
        />
      )}
    </div>
  );
}
