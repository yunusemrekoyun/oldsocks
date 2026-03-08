// src/pages/GuestCheckoutPage.jsx
import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/useCart";
import api from "../../api";

export default function GuestCheckoutPage() {
  const { items, selectedCampaignId } = useCart();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [buyer, setBuyer] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    identityNumber: "", // zorunlu
  });
  const [address, setAddress] = useState({
    title: "Teslimat Adresi",
    mainaddress: "",
    street: "", // zorunlu
    district: "",
    city: "",
    postalCode: "",
  });

  // --- KARGO ---
  const [shipping, setShipping] = useState(null);
  const [shipLoading, setShipLoading] = useState(true);

  // ürünlerin ara toplamı
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

  const canPay =
    buyer.firstName &&
    buyer.lastName &&
    buyer.email &&
    buyer.phone &&
    address.mainaddress &&
    address.street &&
    address.city;

  const startGuestPayment = async () => {
    if (!canPay) return;
    setLoading(true);
    try {
      const payload = {
        cartItems: items,
        selectedCampaignId: selectedCampaignId || null,
        guest: {
          firstName: buyer.firstName.trim(),
          lastName: buyer.lastName.trim(),
          email: buyer.email.trim(),
          phone: buyer.phone.trim(),
          // TCKN boş ise fallback değeri gönder
          identityNumber: buyer.identityNumber.trim() || "11111111111",
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
              discountedSubTotal: Number(
                serverSummary.discountedSubTotal ??
                  serverSummary.subTotal ??
                  0
              ),
              appliedCampaign: data?.appliedCampaign || null,
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
              discountedSubTotal: subTotal,
              appliedCampaign: null,
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

      alert("Ödeme başlatılamadı.");
    } catch (e) {
      console.error("guest payment start error:", e);
      if (e.response?.status === 422) {
        const msg =
          e.response?.data?.message ||
          "Ödeme başlatılamadı. Lütfen bilgilerinizi kontrol edin.";
        alert(msg);
      } else {
        alert(
          e?.response?.data?.message ||
            "Ödeme başlatılamadı. Lütfen tekrar deneyin."
        );
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

        {/* Alıcı Bilgileri */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm mb-1">Ad</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={buyer.firstName}
              onChange={(e) =>
                setBuyer((b) => ({ ...b, firstName: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Soyad</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={buyer.lastName}
              onChange={(e) =>
                setBuyer((b) => ({ ...b, lastName: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="block text-sm mb-1">E-posta</label>
            <input
              type="email"
              className="w-full border rounded px-3 py-2"
              value={buyer.email}
              onChange={(e) =>
                setBuyer((b) => ({ ...b, email: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Telefon</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={buyer.phone}
              onChange={(e) =>
                setBuyer((b) => ({ ...b, phone: e.target.value }))
              }
            />
          </div>

          {/* TCKN */}
          <div className="sm:col-span-2">
            <label className="block text-sm mb-1">T.C. Kimlik No (Opsiyonel)</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={buyer.identityNumber}
              onChange={(e) =>
                setBuyer((b) => ({ ...b, identityNumber: e.target.value }))
              }
            />
          </div>
        </div>

        {/* Adres */}
        <div className="space-y-3 mb-6">
          <div>
            <label className="block text-sm mb-1">Adres (Zorunlu)</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={address.mainaddress}
              onChange={(e) =>
                setAddress((a) => ({ ...a, mainaddress: e.target.value }))
              }
              placeholder="Sokak, bina, daire no…"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm mb-1">Mahalle/Semt</label>
              <input
                className="w-full border rounded px-3 py-2"
                value={address.district}
                onChange={(e) =>
                  setAddress((a) => ({ ...a, district: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-sm mb-1">
                Cadde/Sokak (Zorunlu)
              </label>
              <input
                className="w-full border rounded px-3 py-2"
                value={address.street}
                onChange={(e) =>
                  setAddress((a) => ({ ...a, street: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Şehir (Zorunlu)</label>
              <input
                className="w-full border rounded px-3 py-2"
                value={address.city}
                onChange={(e) =>
                  setAddress((a) => ({ ...a, city: e.target.value }))
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">Posta Kodu</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={address.postalCode}
              onChange={(e) =>
                setAddress((a) => ({ ...a, postalCode: e.target.value }))
              }
            />
          </div>
        </div>

        {/* Sepet Özeti */}
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

        {/* Toplamlar */}
        <div className="space-y-2 border-t pt-4 text-lg font-semibold">
          <div className="flex justify-between">
            <span>Ara Toplam:</span>
            <span>₺{subTotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center">
            <span>Kargo:</span>
            {shipLoading ? (
              <span className="text-gray-500">Kargo yükleniyor…</span>
            ) : shipping ? (
              isFree ? (
                <span className="flex items-center gap-2">
                  <span className="line-through text-gray-500">
                    ₺{Number(shipping.fee).toFixed(2)}
                  </span>
                  <span className="text-emerald-600 font-bold">Ücretsiz</span>
                </span>
              ) : (
                <span>₺{shippingFee.toFixed(2)}</span>
              )
            ) : (
              <span className="text-gray-500">Tanımlı kargo yok</span>
            )}
          </div>

          <div className="flex justify-between text-xl">
            <span>Genel Toplam:</span>
            <span className="text-primary">₺{grandTotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-1/3 py-3 rounded bg-light2 hover:bg-light1 text-dark2 transition"
          >
            Geri
          </button>
          <button
            onClick={startGuestPayment}
            disabled={!canPay || loading}
            className={`w-2/3 py-3 rounded text-white transition ${
              !canPay || loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-dark1 hover:bg-dark2"
            }`}
          >
            {loading ? "Yönlendiriliyor…" : "Ödemeye Geç (Üye olmadan)"}
          </button>
        </div>
      </div>
    </div>
  );
}
