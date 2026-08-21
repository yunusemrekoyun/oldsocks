// src/pages/CheckoutPage.jsx
import React, { useState, useMemo, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useCart } from "../context/useCart";
import { useAuth } from "../context/AuthContext";
import AuthRequiredModal from "../components/auth/AuthRequireModal";
import ToastAlert from "../components/ui/ToastAlert";
import api from "../../api";
import { formatTry } from "../utils/currency";

export default function CheckoutPage() {
  const {
    items,
    selectedCampaignId,
    setSelectedCampaignId,
    selectedCouponCode,
    setSelectedCouponCode,
  } = useCart();
  const { isLoggedIn, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [addrLoading, setAddrLoading] = useState(true);
  const [addrError, setAddrError] = useState("");
  const [addressReloadKey, setAddressReloadKey] = useState(0);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [pricingSummary, setPricingSummary] = useState(null);
  const [appliedCampaign, setAppliedCampaign] = useState(null);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingError, setPricingError] = useState(null);

  // kargo state
  const [shipping, setShipping] = useState(null);
  const [shipLoading, setShipLoading] = useState(true);

  // ürün ara toplamı
  const subTotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.qty, 0),
    [items]
  );

  // kargo bilgisi çek
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setShipLoading(true);
        const { data } = await api.get("/shipping");
        if (!alive) return;
        const list = Array.isArray(data) ? data : [];
        setShipping(list[0] || null);
      } catch (e) {
        console.error("shipping load error:", e);
      } finally {
        if (alive) setShipLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const isFree =
    shipping?.freeShippingThreshold != null &&
    subTotal >= Number(shipping.freeShippingThreshold);

  const shippingFee = shipping ? (isFree ? 0 : Number(shipping.fee || 0)) : 0;
  const grandTotal = subTotal + shippingFee;

  useEffect(() => {
    if (!items.length) {
      setPricingSummary(null);
      setAppliedCampaign(null);
      setAppliedCoupon(null);
      setPricingError(null);
      return;
    }

    let alive = true;
    (async () => {
      try {
        setPricingLoading(true);
        const { data } = await api.post("/cart-campaigns/preview", {
          cartItems: items,
          selectedCampaignId: selectedCampaignId || null,
          couponCode: selectedCouponCode || null,
        });
        if (!alive) return;
        setPricingSummary(data?.summary || null);
        setAppliedCampaign(data?.appliedCampaign || null);
        setAppliedCoupon(data?.appliedCoupon || null);
        setPricingError(null);
      } catch (err) {
        if (!alive) return;
        console.error("checkout pricing preview error:", err);
        const source = err?.response?.data?.source || null;
        setPricingSummary(null);
        setAppliedCampaign(null);
        setAppliedCoupon(null);
        setPricingError(
          err?.response?.data?.message || "Sipariş özeti güncellenemedi."
        );
        if (source === "campaign" && selectedCampaignId) {
          setSelectedCampaignId(null);
        }
        if (source === "coupon" && selectedCouponCode) {
          setSelectedCouponCode(null);
        }
      } finally {
        if (alive) setPricingLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [
    items,
    selectedCampaignId,
    selectedCouponCode,
    setSelectedCampaignId,
    setSelectedCouponCode,
  ]);

  const displaySubTotal = Number(pricingSummary?.subTotal ?? subTotal);
  const displayCampaignDiscount = Number(
    pricingSummary?.campaignDiscount ?? 0
  );
  const displayCouponDiscount = Number(pricingSummary?.couponDiscount ?? 0);
  const displayDiscountedSubTotal = Number(
    pricingSummary?.discountedSubTotal ??
      Math.max(0, displaySubTotal - displayCampaignDiscount - displayCouponDiscount)
  );
  const displayShippingFee = Number(pricingSummary?.shippingFee ?? shippingFee);
  const displayGrandTotal = Number(pricingSummary?.grandTotal ?? grandTotal);
  const displayIsFree = pricingSummary ? Boolean(pricingSummary.isFree) : isFree;
  const displayShippingName = pricingSummary?.shippingName || shipping?.name || null;
  const displayFreeShippingThreshold =
    pricingSummary?.freeShippingThreshold ?? shipping?.freeShippingThreshold ?? null;

  useEffect(() => {
    let alive = true;
    setAddrLoading(true);
    setAddrError("");
    api
      .get("/users/me/addresses")
      .then(({ data }) => {
        if (!alive) return;
        const list = Array.isArray(data) ? data : [];
        setAddresses(list);
        if (list.length) setSelectedAddress(list[0]._id);
      })
      .catch(() => {
        if (!alive) return;
        setAddresses([]);
        setAddrError("Adresleriniz alınamadı. Bağlantınızı kontrol edip tekrar deneyin.");
      })
      .finally(() => {
        if (alive) setAddrLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [addressReloadKey]);

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

  if (addrError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <p className="mb-4 text-red-700">{addrError}</p>
        <button
          type="button"
          onClick={() => setAddressReloadKey((value) => value + 1)}
          className="rounded bg-dark1 px-5 py-2 text-white"
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

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

  const attemptPayment = async () => {
    if (!selectedAddress) {
      setToast({ type: "error", msg: "Lütfen bir adres seçin." });
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/payment/start", {
        cartItems: items,
        addressId: selectedAddress,
        selectedCampaignId: selectedCampaignId || null,
        couponCode: selectedCouponCode || null,
      });

      if (data?.conversationId) {
        const serverSummary = data.summary || null;
        const summary = serverSummary
          ? {
              subTotal: Number(serverSummary.subTotal ?? 0),
              shippingFee: Number(serverSummary.shippingFee ?? 0),
              grandTotal: Number(serverSummary.grandTotal ?? 0),
              isFree: Boolean(serverSummary.isFree),
              shippingName: serverSummary.shippingName ?? null,
              freeShippingThreshold:
                serverSummary.freeShippingThreshold ?? null,
              campaignDiscount: Number(serverSummary.campaignDiscount ?? 0),
              couponDiscount: Number(serverSummary.couponDiscount ?? 0),
              discountedSubTotal: Number(
                serverSummary.discountedSubTotal ??
                  serverSummary.subTotal ??
                  0
              ),
              appliedCampaign: data?.appliedCampaign || null,
              appliedCoupon: data?.appliedCoupon || null,
            }
          : {
              subTotal,
              shippingFee,
              grandTotal,
              isFree,
              shippingName: shipping?.name || null,
              freeShippingThreshold:
                shipping?.freeShippingThreshold ?? null,
              campaignDiscount: 0,
              couponDiscount: 0,
              discountedSubTotal: subTotal,
              appliedCampaign: null,
              appliedCoupon: null,
            };
        navigate("/payment", {
          state: {
            conversationId: data.conversationId,
            selectedAddress: selectedAddress,
            summary,
          },
        });
        return;
      }

      setToast({ type: "error", msg: "Ödeme başlatılamadı." });
    } catch (err) {
      console.error("Ödeme başlatılamadı:", err);
      if (err.response?.status === 401) {
        setShowLoginModal(true);
      } else if (err.response?.status === 422) {
        const msg =
          err.response?.data?.message ||
          "Ödeme başlatılamadı. Lütfen bilgilerinizi kontrol edin.";
        setToast({ type: "error", msg });
      } else {
        setToast({
          type: "error",
          msg:
            err?.response?.data?.message ||
            "Ödeme başlatılamadı. Lütfen tekrar deneyin.",
        });
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
                  Adet: {it.qty} × {formatTry(it.price)}
                </p>
              </div>
              <div className="font-semibold">
                {formatTry(it.price * it.qty)}
              </div>
            </li>
          ))}
        </ul>

        <div className="space-y-2 border-t pt-4 text-lg font-semibold">
          <div className="flex justify-between">
            <span>Ara Toplam:</span>
            <span>{formatTry(displaySubTotal)}</span>
          </div>

          {displayCampaignDiscount > 0 && (
            <div className="flex justify-between text-emerald-700 text-base">
              <span>Kampanya İndirimi</span>
              <span>-{formatTry(displayCampaignDiscount)}</span>
            </div>
          )}

          {displayCouponDiscount > 0 && (
            <div className="flex justify-between text-blue-700 text-base">
              <span>
                Kupon İndirimi
                {appliedCoupon?.code ? ` (${appliedCoupon.code})` : ""}
              </span>
              <span>-{formatTry(displayCouponDiscount)}</span>
            </div>
          )}

          {(displayCampaignDiscount > 0 || displayCouponDiscount > 0) && (
            <div className="flex justify-between text-base">
              <span>İndirimli Ara Toplam:</span>
              <span>{formatTry(displayDiscountedSubTotal)}</span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span>
              Kargo{displayShippingName ? ` (${displayShippingName})` : ""}
            </span>
            {shipLoading || pricingLoading ? (
              <span className="text-gray-500">Kargo yükleniyor…</span>
            ) : shipping || pricingSummary ? (
              displayIsFree ? (
                <span className="flex items-center gap-2">
                  <span className="line-through text-gray-500">
                    {formatTry(shipping?.fee ?? displayShippingFee)}
                  </span>
                  <span className="text-emerald-600 font-bold">Ücretsiz</span>
                </span>
              ) : (
                <span>{formatTry(displayShippingFee)}</span>
              )
            ) : (
              <span className="text-gray-500">Tanımlı kargo yok</span>
            )}
          </div>

          {displayFreeShippingThreshold != null && !displayIsFree && (
            <p className="text-sm text-gray-500">
              {formatTry(displayFreeShippingThreshold, { fractionDigits: 0 })} ve üzeri
              alışverişlerde kargo ücretsiz.
            </p>
          )}

          <div className="flex justify-between text-xl">
            <span>Genel Toplam:</span>
            <span className="text-primary">{formatTry(displayGrandTotal)}</span>
          </div>
        </div>

        {(appliedCampaign?.name || appliedCoupon?.code || pricingError) && (
          <div className="mt-4 space-y-1 text-sm">
            {appliedCampaign?.name && (
              <p className="text-emerald-700">
                Uygulanan kampanya: <b>{appliedCampaign.name}</b>
              </p>
            )}
            {appliedCoupon?.code && (
              <p className="text-blue-700">
                Uygulanan kupon: <b>{appliedCoupon.code}</b>
              </p>
            )}
            {pricingError && <p className="text-red-600">{pricingError}</p>}
          </div>
        )}

        <button
          onClick={() => attemptPayment(false)}
          disabled={loading}
          className={`mt-6 w-full py-3 rounded text-white transition ${
            loading ? "bg-gray-400" : "bg-dark1 hover:bg-dark2"
          }`}
        >
          {loading ? "Yönlendiriliyor…" : "Ödemeye Geç"}
        </button>
      </div>

      {showLoginModal && (
        <AuthRequiredModal
          open
          onClose={() => setShowLoginModal(false)}
          onLogin={() => navigate("/auth", { state: { from: "/checkout" } })}
        />
      )}

      {toast && (
        <ToastAlert
          msg={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
