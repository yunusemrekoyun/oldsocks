import React, { useMemo, useState, useEffect } from "react";
import { IMaskInput } from "react-imask";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/useCart";
import ToastAlert from "../components/ui/ToastAlert";
import api from "../../api";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const GUEST_FIELD_KEYS = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "identityNumber",
  "mainaddress",
  "street",
  "city",
];

function getPhoneDigits(value) {
  return String(value || "")
    .replace(/\D/g, "")
    .slice(-10);
}

function toE164TrPhone(value) {
  const digits = getPhoneDigits(value);
  return digits.length === 10 ? `+90${digits}` : "";
}

function normalizeIdentityNumber(value) {
  return String(value || "")
    .replace(/\D/g, "")
    .slice(0, 11);
}

function validateGuestCheckout(buyer, address) {
  const errors = {};

  if (!buyer.firstName.trim()) errors.firstName = "Ad zorunlu.";
  if (!buyer.lastName.trim()) errors.lastName = "Soyad zorunlu.";

  const email = buyer.email.trim().toLowerCase();
  if (!email) {
    errors.email = "E-posta zorunlu.";
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = "Geçerli bir e-posta adresi girin.";
  }

  const phoneDigits = getPhoneDigits(buyer.phone);
  if (phoneDigits.length !== 10) {
    errors.phone = "Telefon numarasını 10 haneli girin.";
  }

  const identityNumber = normalizeIdentityNumber(buyer.identityNumber);
  if (buyer.identityNumber.trim() && identityNumber.length !== 11) {
    errors.identityNumber = "T.C. Kimlik No 11 haneli olmalı.";
  }

  if (!address.mainaddress.trim()) {
    errors.mainaddress = "Adres zorunlu.";
  }
  if (!address.street.trim()) {
    errors.street = "Cadde/Sokak zorunlu.";
  }
  if (!address.city.trim()) {
    errors.city = "Şehir zorunlu.";
  }

  return errors;
}

function focusFirstInvalidField(errors) {
  const firstInvalidField = GUEST_FIELD_KEYS.find((key) => errors[key]);
  if (!firstInvalidField || typeof document === "undefined") return;
  const target = document.getElementById(firstInvalidField);
  if (target && typeof target.focus === "function") {
    target.focus();
  }
}

export default function GuestCheckoutPage() {
  const {
    items,
    selectedCampaignId,
    setSelectedCampaignId,
    selectedCouponCode,
    setSelectedCouponCode,
  } = useCart();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [buyer, setBuyer] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    identityNumber: "",
  });
  const [address, setAddress] = useState({
    title: "Teslimat Adresi",
    mainaddress: "",
    street: "",
    district: "",
    city: "",
    postalCode: "",
  });
  const [touched, setTouched] = useState({});

  const [shipping, setShipping] = useState(null);
  const [shipLoading, setShipLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [pricingSummary, setPricingSummary] = useState(null);
  const [appliedCampaign, setAppliedCampaign] = useState(null);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingError, setPricingError] = useState(null);

  const subTotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.qty, 0),
    [items]
  );

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
        const email =
          EMAIL_REGEX.test(String(buyer.email || "").trim().toLowerCase())
            ? String(buyer.email || "").trim().toLowerCase()
            : null;
        const { data } = await api.post("/cart-campaigns/preview", {
          cartItems: items,
          selectedCampaignId: selectedCampaignId || null,
          couponCode: selectedCouponCode || null,
          customerEmail: email,
        });
        if (!alive) return;
        setPricingSummary(data?.summary || null);
        setAppliedCampaign(data?.appliedCampaign || null);
        setAppliedCoupon(data?.appliedCoupon || null);
        setPricingError(null);
      } catch (err) {
        if (!alive) return;
        console.error("guest checkout pricing preview error:", err);
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
    buyer.email,
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

  const validationErrors = useMemo(
    () => validateGuestCheckout(buyer, address),
    [buyer, address]
  );

  const setBuyerField = (field, value) => {
    setBuyer((prev) => ({ ...prev, [field]: value }));
  };

  const setAddressField = (field, value) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
  };

  const touchField = (field) => {
    setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
  };

  const markAllTouched = () => {
    setTouched((prev) => {
      const next = { ...prev };
      GUEST_FIELD_KEYS.forEach((field) => {
        next[field] = true;
      });
      return next;
    });
  };

  const getFieldClassName = (field) => {
    const hasError = touched[field] && validationErrors[field];
    return [
      "w-full rounded px-3 py-2 outline-none transition",
      hasError
        ? "border border-red-500 bg-red-50 focus:border-red-600"
        : "border border-light2 focus:border-dark1",
    ].join(" ");
  };

  const startGuestPayment = async () => {
    if (Object.keys(validationErrors).length > 0) {
      markAllTouched();
      focusFirstInvalidField(validationErrors);
      setToast({
        type: "error",
        msg: "Lütfen işaretli alanları kontrol edin.",
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        cartItems: items,
        selectedCampaignId: selectedCampaignId || null,
        couponCode: selectedCouponCode || null,
        guest: {
          firstName: buyer.firstName.trim(),
          lastName: buyer.lastName.trim(),
          email: buyer.email.trim().toLowerCase(),
          phone: toE164TrPhone(buyer.phone),
          identityNumber: normalizeIdentityNumber(buyer.identityNumber) || "11111111111",
          registrationAddress: address.mainaddress.trim(),
        },
        address: {
          title: address.title || "Teslimat Adresi",
          mainaddress: address.mainaddress.trim(),
          street: address.street.trim(),
          district: address.district?.trim() || "",
          city: address.city.trim(),
          postalCode: address.postalCode?.trim() || "",
        },
      };

      const { data } = await api.post("/payment/start-guest", payload);

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
            guest: true,
            summary,
          },
        });
        return;
      }

      setToast({ type: "error", msg: "Ödeme başlatılamadı." });
    } catch (e) {
      console.error("guest payment start error:", e);
      if (e.response?.status === 422) {
        const msg =
          e.response?.data?.message ||
          "Ödeme başlatılamadı. Lütfen bilgilerinizi kontrol edin.";
        setToast({ type: "error", msg });
      } else {
        setToast({
          type: "error",
          msg:
            e?.response?.data?.message ||
            "Ödeme başlatılamadı. Lütfen tekrar deneyin.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    navigate("/cart", { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-light1 text-dark1 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">Üye Olmadan Ödeme</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label htmlFor="firstName" className="block text-sm mb-1">
              Ad
            </label>
            <input
              id="firstName"
              className={getFieldClassName("firstName")}
              value={buyer.firstName}
              onChange={(e) => setBuyerField("firstName", e.target.value)}
              onBlur={() => touchField("firstName")}
              autoComplete="given-name"
            />
            {touched.firstName && validationErrors.firstName && (
              <p className="mt-1 text-xs text-red-600">
                {validationErrors.firstName}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm mb-1">
              Soyad
            </label>
            <input
              id="lastName"
              className={getFieldClassName("lastName")}
              value={buyer.lastName}
              onChange={(e) => setBuyerField("lastName", e.target.value)}
              onBlur={() => touchField("lastName")}
              autoComplete="family-name"
            />
            {touched.lastName && validationErrors.lastName && (
              <p className="mt-1 text-xs text-red-600">
                {validationErrors.lastName}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm mb-1">
              E-posta
            </label>
            <input
              id="email"
              type="email"
              className={getFieldClassName("email")}
              value={buyer.email}
              onChange={(e) => setBuyerField("email", e.target.value)}
              onBlur={() => touchField("email")}
              autoComplete="email"
              inputMode="email"
              placeholder="ornek@mail.com"
            />
            {touched.email && validationErrors.email && (
              <p className="mt-1 text-xs text-red-600">{validationErrors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm mb-1">
              Telefon
            </label>
            <div
              className={[
                "flex items-center overflow-hidden rounded transition",
                touched.phone && validationErrors.phone
                  ? "border border-red-500 bg-red-50"
                  : "border border-light2",
              ].join(" ")}
            >
              <span className="px-3 py-2 bg-light1 text-dark2 border-r border-light2">
                +90
              </span>
              <IMaskInput
                id="phone"
                mask="500 000 00 00"
                definitions={{ 0: /[0-9]/ }}
                value={buyer.phone}
                onAccept={(value) => setBuyerField("phone", value)}
                onBlur={() => touchField("phone")}
                unmask={false}
                inputMode="tel"
                placeholder="5__ ___ __ __"
                className="w-full px-3 py-2 bg-white outline-none"
              />
            </div>
            <p className="mt-1 text-xs text-dark2">Başına +90 otomatik eklenir.</p>
            {touched.phone && validationErrors.phone && (
              <p className="mt-1 text-xs text-red-600">{validationErrors.phone}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="identityNumber" className="block text-sm mb-1">
              T.C. Kimlik No (Opsiyonel)
            </label>
            <input
              id="identityNumber"
              className={getFieldClassName("identityNumber")}
              value={buyer.identityNumber}
              onChange={(e) =>
                setBuyerField(
                  "identityNumber",
                  normalizeIdentityNumber(e.target.value)
                )
              }
              onBlur={() => touchField("identityNumber")}
              inputMode="numeric"
              maxLength={11}
              placeholder="11 haneli T.C. Kimlik No"
            />
            <p className="mt-1 text-xs text-dark2">Girilecekse sadece rakam ve 11 hane olmalı.</p>
            {touched.identityNumber && validationErrors.identityNumber && (
              <p className="mt-1 text-xs text-red-600">
                {validationErrors.identityNumber}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div>
            <label htmlFor="mainaddress" className="block text-sm mb-1">
              Adres (Zorunlu)
            </label>
            <input
              id="mainaddress"
              className={getFieldClassName("mainaddress")}
              value={address.mainaddress}
              onChange={(e) => setAddressField("mainaddress", e.target.value)}
              onBlur={() => touchField("mainaddress")}
              placeholder="Sokak, bina, daire no…"
              autoComplete="street-address"
            />
            {touched.mainaddress && validationErrors.mainaddress && (
              <p className="mt-1 text-xs text-red-600">
                {validationErrors.mainaddress}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="district" className="block text-sm mb-1">
                Mahalle/Semt
              </label>
              <input
                id="district"
                className="w-full border border-light2 rounded px-3 py-2 outline-none transition focus:border-dark1"
                value={address.district}
                onChange={(e) => setAddressField("district", e.target.value)}
                autoComplete="address-level3"
              />
            </div>
            <div>
              <label htmlFor="street" className="block text-sm mb-1">
                Cadde/Sokak (Zorunlu)
              </label>
              <input
                id="street"
                className={getFieldClassName("street")}
                value={address.street}
                onChange={(e) => setAddressField("street", e.target.value)}
                onBlur={() => touchField("street")}
                autoComplete="address-line2"
              />
              {touched.street && validationErrors.street && (
                <p className="mt-1 text-xs text-red-600">{validationErrors.street}</p>
              )}
            </div>
            <div>
              <label htmlFor="city" className="block text-sm mb-1">
                Şehir (Zorunlu)
              </label>
              <input
                id="city"
                className={getFieldClassName("city")}
                value={address.city}
                onChange={(e) => setAddressField("city", e.target.value)}
                onBlur={() => touchField("city")}
                autoComplete="address-level2"
              />
              {touched.city && validationErrors.city && (
                <p className="mt-1 text-xs text-red-600">{validationErrors.city}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="postalCode" className="block text-sm mb-1">
              Posta Kodu
            </label>
            <input
              id="postalCode"
              className="w-full border border-light2 rounded px-3 py-2 outline-none transition focus:border-dark1"
              value={address.postalCode}
              onChange={(e) => setAddressField("postalCode", e.target.value)}
              autoComplete="postal-code"
              inputMode="numeric"
            />
          </div>
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
              <div className="font-semibold">₺{(it.price * it.qty).toFixed(2)}</div>
            </li>
          ))}
        </ul>

        <div className="space-y-2 border-t pt-4 text-lg font-semibold">
          <div className="flex justify-between">
            <span>Ara Toplam:</span>
            <span>₺{displaySubTotal.toFixed(2)}</span>
          </div>

          {displayCampaignDiscount > 0 && (
            <div className="flex justify-between text-emerald-700 text-base">
              <span>Kampanya İndirimi</span>
              <span>-₺{displayCampaignDiscount.toFixed(2)}</span>
            </div>
          )}

          {displayCouponDiscount > 0 && (
            <div className="flex justify-between text-blue-700 text-base">
              <span>
                Kupon İndirimi
                {appliedCoupon?.code ? ` (${appliedCoupon.code})` : ""}
              </span>
              <span>-₺{displayCouponDiscount.toFixed(2)}</span>
            </div>
          )}

          {(displayCampaignDiscount > 0 || displayCouponDiscount > 0) && (
            <div className="flex justify-between text-base">
              <span>İndirimli Ara Toplam:</span>
              <span>₺{displayDiscountedSubTotal.toFixed(2)}</span>
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
                    ₺{Number(shipping?.fee ?? displayShippingFee).toFixed(2)}
                  </span>
                  <span className="text-emerald-600 font-bold">Ücretsiz</span>
                </span>
              ) : (
                <span>₺{displayShippingFee.toFixed(2)}</span>
              )
            ) : (
              <span className="text-gray-500">Tanımlı kargo yok</span>
            )}
          </div>

          {displayFreeShippingThreshold != null && !displayIsFree && (
            <p className="text-sm text-gray-500">
              ₺{Number(displayFreeShippingThreshold).toFixed(0)} ve üzeri
              alışverişlerde kargo ücretsiz.
            </p>
          )}

          <div className="flex justify-between text-xl">
            <span>Genel Toplam:</span>
            <span className="text-primary">₺{displayGrandTotal.toFixed(2)}</span>
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

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-1/3 py-3 rounded bg-light2 hover:bg-light1 text-dark2 transition"
          >
            Geri
          </button>
          <button
            onClick={startGuestPayment}
            disabled={loading}
            className={`w-2/3 py-3 rounded text-white transition ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-dark1 hover:bg-dark2"
            }`}
          >
            {loading ? "Yönlendiriliyor…" : "Ödemeye Geç (Üye olmadan)"}
          </button>
        </div>

        {toast && (
          <ToastAlert
            msg={toast.msg}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
}
