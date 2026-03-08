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
  const {
    items,
    clearCart,
    selectedCampaignId,
    setSelectedCampaignId,
  } = useCart();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Tek onay (KVKK + sözleşme)
  const [consentChecked, setConsentChecked] = useState(false);

  // Kampanya/pricing preview
  const [pricingSummary, setPricingSummary] = useState(null);
  const [eligibleCampaigns, setEligibleCampaigns] = useState([]);
  const [appliedCampaign, setAppliedCampaign] = useState(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingError, setPricingError] = useState(null);

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

  useEffect(() => {
    if (items.length === 0) {
      setPricingSummary(null);
      setEligibleCampaigns([]);
      setAppliedCampaign(null);
      setPricingError(null);
      if (selectedCampaignId) setSelectedCampaignId(null);
      return;
    }

    let alive = true;
    (async () => {
      try {
        setPricingLoading(true);
        const { data } = await api.post("/cart-campaigns/preview", {
          cartItems: items,
          selectedCampaignId: selectedCampaignId || null,
        });
        if (!alive) return;
        const eligible = Array.isArray(data?.eligibleCampaigns)
          ? data.eligibleCampaigns
          : [];
        const applied = data?.appliedCampaign || null;

        setPricingSummary(data?.summary || null);
        setEligibleCampaigns(eligible);
        setAppliedCampaign(applied);
        setPricingError(null);
      } catch (e) {
        console.error("Sepet fiyatlandırması alınamadı:", e);
        const message =
          e?.response?.data?.message || "Kampanya hesaplanamadı.";
        setPricingError(message);
        setPricingSummary(null);
        setEligibleCampaigns([]);
        setAppliedCampaign(null);

        if (e?.response?.status === 409 && selectedCampaignId) {
          setSelectedCampaignId(null);
        }
      } finally {
        if (alive) setPricingLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [items, selectedCampaignId, setSelectedCampaignId]);

  // Ara toplam
  const localSubTotal = useMemo(
    () => items.reduce((total, item) => total + item.price * item.qty, 0),
    [items]
  );

  // Ücretsiz kargo koşulu
  const localIsFree =
    shipping?.freeShippingThreshold != null &&
    localSubTotal >= Number(shipping.freeShippingThreshold);

  // Ödenecek kargo bedeli
  const localShippingFee = !shipping
    ? 0
    : localIsFree
    ? 0
    : Number(shipping.fee || 0);

  const subTotal = Number(pricingSummary?.subTotal ?? localSubTotal);
  const campaignDiscount = Number(pricingSummary?.campaignDiscount ?? 0);
  const discountedSubTotal = Number(
    pricingSummary?.discountedSubTotal ?? Math.max(0, subTotal - campaignDiscount)
  );
  const shippingFee = Number(pricingSummary?.shippingFee ?? localShippingFee);
  const grandTotal = Number(pricingSummary?.grandTotal ?? discountedSubTotal + shippingFee);
  const shippingName = pricingSummary?.shippingName || shipping?.name || null;
  const isFree = pricingSummary ? Boolean(pricingSummary.isFree) : localIsFree;
  const freeShippingThreshold =
    pricingSummary?.freeShippingThreshold ?? shipping?.freeShippingThreshold ?? null;

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

              {campaignDiscount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-dark2">Kampanya İndirimi</span>
                  <span className="font-medium text-emerald-700">
                    -₺{campaignDiscount.toFixed(2)}
                  </span>
                </div>
              )}

              {campaignDiscount > 0 && (
                <div className="flex items-center justify-between text-[13px] text-gray-600">
                  <span>İndirimli Ara Toplam</span>
                  <span className="font-medium">
                    ₺{discountedSubTotal.toFixed(2)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-dark2">
                    Kargo{shippingName ? ` (${shippingName})` : ""}
                  </span>
                  {(shipLoading || pricingLoading) && (
                    <span className="text-xs text-gray-500">hesaplanıyor…</span>
                  )}
                  {!pricingSummary && shipError && (
                    <span className="text-xs text-red-600">{shipError}</span>
                  )}
                </div>

                {pricingSummary || shipping ? (
                  isFree ? (
                    <div className="flex items-center gap-2">
                      <s className="text-gray-400">
                        ₺
                        {Number(
                          shipping?.fee ?? pricingSummary?.shippingFee ?? 0
                        ).toFixed(2)}
                      </s>
                      <span className="font-medium">₺0.00</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                        Kargo ücretsiz
                      </span>
                    </div>
                  ) : (
                    <span className="font-medium">
                      ₺{shippingFee.toFixed(2)}
                    </span>
                  )
                ) : (
                  <span className="font-medium">₺0.00</span>
                )}
              </div>

              {freeShippingThreshold != null && !isFree && (
                <div className="text-xs text-gray-500 text-right">
                  ₺{Number(freeShippingThreshold).toFixed(0)} ve üzeri
                  alışverişlerde kargo ücretsiz.
                </div>
              )}
            </div>

            <div className="h-px bg-light2 my-4" />

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-dark1">Kampanya Seçimi</h4>

              {pricingLoading && (
                <p className="text-xs text-gray-500">Kampanyalar hesaplanıyor…</p>
              )}

              {pricingError && (
                <p className="text-xs text-red-600">{pricingError}</p>
              )}

              {!pricingLoading && !pricingError && eligibleCampaigns.length === 0 && (
                <p className="text-xs text-gray-500">
                  Sepetiniz için uygun kampanya bulunamadı.
                </p>
              )}

              {!pricingLoading && eligibleCampaigns.length > 0 && (
                <div className="space-y-2 text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="campaign"
                      checked={!selectedCampaignId}
                      onChange={() => setSelectedCampaignId(null)}
                    />
                    <span>Kampanya kullanma</span>
                  </label>

                  {eligibleCampaigns.map((c) => {
                    const cid = String(c.campaignId);
                    const checked = String(selectedCampaignId || "") === cid;
                    return (
                      <label
                        key={cid}
                        className="flex items-center justify-between gap-2 cursor-pointer p-2 rounded-md border border-light2"
                      >
                        <span className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="campaign"
                            checked={checked}
                            onChange={() => setSelectedCampaignId(cid)}
                          />
                          <span>{c.name}</span>
                        </span>
                        <span className="text-emerald-700 font-medium">
                          -₺{Number(c.savings || 0).toFixed(2)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              {appliedCampaign?.name && (
                <p className="text-xs text-emerald-700">
                  Uygulanan kampanya: {appliedCampaign.name}
                </p>
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
