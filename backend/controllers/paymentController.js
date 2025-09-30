// backend/controllers/paymentController.js
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const User = require("../models/User");
const Order = require("../models/Order");
const fallbackData = require("../config/fallback.json");
const { sendOrderPlacedMail } = require("../utils/mailer");
const { applyStockChanges } = require("../utils/updateStock");

/* Frontend base (ilk origin) */
const FRONTEND_BASE = (() => {
  const raw = process.env.FRONTEND_ORIGIN || "";
  const first = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)[0];
  return first || "http://localhost:5173";
})();

/* helpers */
function tlToKurus(n) {
  return Math.round(Number(n || 0) * 100);
}
function asTL(n) {
  const v = Number(n || 0);
  return "₺" + v.toFixed(2);
}
function getClientIp(req) {
  const xff = (req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  let ip = xff || req.ip || req.connection?.remoteAddress || "127.0.0.1";
  if (ip === "::1") ip = "127.0.0.1"; // IPv6 loopback -> IPv4
  if (ip.startsWith("::ffff:")) ip = ip.replace("::ffff:", ""); // IPv4-mapped
  ip = ip.split(":").slice(-1)[0]; // son parçayı al (port vs)
  return ip;
}
function safeLogPaytrInput(inp) {
  try {
    const copy = { ...inp };
    if (copy.user_basket && copy.user_basket.length > 30) {
      copy.user_basket_preview =
        copy.user_basket.slice(0, 30) + "...(" + copy.user_basket.length + ")";
      delete copy.user_basket;
    }
    console.log("[PAYTR][debug]", copy);
  } catch {}
}

exports.startGuestPaymentSession = async (req, res) => {
  try {
    const { cartItems, totalPrice, address, guest } = req.body || {};

    // 1) Basit zorunlu alan kontrolü (fallback YOK)
    const missing = [];
    if (!guest?.firstName) missing.push("guest.firstName");
    if (!guest?.lastName) missing.push("guest.lastName");
    if (!guest?.email) missing.push("guest.email");
    if (!guest?.phone) missing.push("guest.phone");
    if (!guest?.identityNumber) missing.push("guest.identityNumber");
    if (!guest?.registrationAddress) missing.push("guest.registrationAddress");

    if (!address?.title) missing.push("address.title");
    if (!address?.mainaddress) missing.push("address.mainaddress");
    if (!address?.street) missing.push("address.street");
    if (!address?.city) missing.push("address.city");

    if (!Array.isArray(cartItems) || cartItems.length === 0)
      missing.push("cartItems");
    if (typeof totalPrice !== "number") missing.push("totalPrice");

    if (missing.length) {
      return res.status(400).json({
        message: "Eksik/Geçersiz alanlar var.",
        missing,
      });
    }

    // 2) merchant_oid / orderNumber üret
    const conversationId = uuidv4()
      .replace(/-/g, "")
      .toUpperCase()
      .slice(0, 64);
    const orderNumber = Math.floor(1e9 + Math.random() * 9e9).toString();

    // 3) Order yarat (user YOK, guest DOLU)
    await Order.create({
      orderNumber,
      user: undefined,
      guest: {
        firstName: guest.firstName,
        lastName: guest.lastName,
        email: guest.email,
        phone: guest.phone,
        identityNumber: guest.identityNumber,
        registrationAddress: guest.registrationAddress,
      },
      items: cartItems.map((it) => ({
        productId: it.id,
        name: it.name,
        price: it.price,
        qty: it.qty,
        size: it.size,
        color: it.color,
      })),
      totalPrice,
      address: {
        title: address.title,
        mainaddress: address.mainaddress,
        street: address.street,
        district: address.district || "",
        city: address.city,
        postalCode: address.postalCode || "",
      },
      conversationId,
      status: "pending",
      iyzInit: null,
    });

    return res.json({
      conversationId,
      inlineUrl: `${process.env.BACKEND_PUBLIC_URL}/api/v1/payment/inline/${conversationId}`,
    });
  } catch (e) {
    console.error("[PAYMENT][start-guest] Hata:", e);
    res.status(500).json({ message: "Misafir ödemesi başlatılamadı." });
  }
};
/** 1) Ödeme oturumunu başlat (pending Order) */
exports.startPaymentSession = async (req, res) => {
  try {
    console.log("[PAYMENT][start] user:", req.user?.userId, "body:", req.body);

    const { cartItems, totalPrice, addressId, useFallback } = req.body;
    const userId = req.user.userId;
    const userDoc = await User.findById(userId).lean();

    // Adres seçimi
    const addr = userDoc?.addresses?.find(
      (a) => String(a._id) === String(addressId)
    ) ||
      userDoc?.addresses?.[0] || {
        title: "Varsayılan Adres",
        mainaddress: fallbackData.registrationAddress,
        street: "",
        district: "",
        city: fallbackData.city,
        postalCode: "",
      };

    // Eksik müşteri verisi kontrolü
    const missing = [];
    const firstName =
      userDoc?.firstName ||
      (missing.push("firstName") && fallbackData.firstName);
    const lastName =
      userDoc?.lastName || (missing.push("lastName") && fallbackData.lastName);
    const phone =
      userDoc?.phone || (missing.push("phone") && fallbackData.phone);
    const email =
      userDoc?.email || (missing.push("email") && fallbackData.email);
    const identityNumber =
      userDoc?.identityNumber ||
      (missing.push("identityNumber") && fallbackData.identityNumber);
    const registrationAddress =
      addr?.mainaddress ||
      (missing.push("registrationAddress") && fallbackData.registrationAddress);
    const city = addr?.city || (missing.push("city") && fallbackData.city);

    if (!useFallback && missing.length) {
      return res.status(206).json({
        message: "Eksik kullanıcı verisi var.",
        missing,
        fallbackData,
      });
    }

    // PayTR merchant_oid şartına uygun benzersiz ID (alfanümerik, 64 max)
    const conversationId = uuidv4()
      .replace(/-/g, "")
      .toUpperCase()
      .slice(0, 64);
    const orderNumber = Math.floor(1e9 + Math.random() * 9e9).toString();

    // Pending Order
    await Order.create({
      orderNumber,
      user: userId,
      items: (cartItems || []).map((it) => ({
        productId: it.id,
        name: it.name,
        price: it.price,
        qty: it.qty,
        size: it.size,
        color: it.color,
      })),
      totalPrice,
      address: {
        title: addr.title,
        mainaddress: addr.mainaddress,
        street: addr.street,
        district: addr.district,
        city: addr.city,
        postalCode: addr.postalCode,
      },
      conversationId,
      status: "pending",
      iyzInit: null,
    });

    return res.json({
      conversationId,
      inlineUrl: `${process.env.BACKEND_PUBLIC_URL}/api/v1/payment/inline/${conversationId}`,
    });
  } catch (e) {
    console.error("[Payment][start] Hata:", e);
    res.status(500).json({ message: "Ödeme başlatılamadı." });
  }
};

/** 2) INLINE: PayTR token ya da MOCK HTML döner (JSON) */
exports.inlineCheckoutHtml = async (req, res) => {
  try {
    console.log(
      "[PAYTR][inline] çağrıldı convId:",
      req.params.conversationId,
      "ip:",
      getClientIp(req)
    );

    // cache kesin kapalı — tekrar kullanım/yeniden yükleme olmasın
    res.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    res.set("Surrogate-Control", "no-store");

    const { conversationId } = req.params;
    const order = await Order.findOne({ conversationId }).lean();
    if (!order || order.status !== "pending") {
      return res.status(404).json({ message: "Geçersiz sipariş." });
    }

    const useMock =
      String(process.env.PAY_PROVIDER || "").toLowerCase() === "mock" ||
      !process.env.PAYTR_MERCHANT_ID ||
      !process.env.PAYTR_MERCHANT_KEY ||
      !process.env.PAYTR_MERCHANT_SALT;

    if (useMock) {
      // ---- MOCK ÖDEME SAYFASI ----
      const ok = `${FRONTEND_BASE}/payment-result?status=success&conversationId=${conversationId}&paymentId=mock_${conversationId}`;
      const fail = `${FRONTEND_BASE}/payment-result?status=failure&conversationId=${conversationId}&message=${encodeURIComponent(
        "Simülasyon: ödeme başarısız."
      )}`;

      const itemsHtml = (order.items || [])
        .map(
          (it) => `
            <li style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #eee">
              <span>${it.name} ${it.size ? "• " + it.size : ""} ${
            it.color ? "• " + it.color : ""
          }</span>
              <b>${it.qty} × ${asTL(it.price)}</b>
            </li>`
        )
        .join("");

      const html = `<!doctype html>
<html lang="tr"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Arial,sans-serif;margin:0;background:#fff}
  .wrap{max-width:720px;margin:16px auto;padding:16px;border:1px solid #e5e7eb;border-radius:12px}
  .btn{display:inline-block;padding:10px 16px;border-radius:10px;text-decoration:none}
  .ok{background:#16a34a;color:#fff} .fail{background:#ef4444;color:#fff}
  ul{list-style:none;padding:0;margin:10px 0}
</style>
</head><body>
  <div class="wrap">
    <h2 style="margin:0 0 8px 0">Simüle Edilen Ödeme</h2>
    <p style="color:#6b7280;margin:0 0 10px 0">PayTR anahtarları tanımlı değil. Geliştirme için sahte bir ödeme ekranı gösteriliyor.</p>

    <h3 style="margin:12px 0 6px 0">Sepet</h3>
    <ul>${itemsHtml}</ul>

    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding-top:10px;border-top:1px solid #eee">
      <b>Toplam</b>
      <b>${asTL(order.totalPrice)}</b>
    </div>

    <div style="margin-top:16px;display:flex;gap:10px">
      <a class="btn ok" href="${ok}">Ödemeyi Başarılı Simüle Et</a>
      <a class="btn fail" href="${fail}">Ödemeyi Başarısız Simüle Et</a>
    </div>

    <p style="margin-top:10px;color:#6b7280;font-size:12px">
      Başarılıyı seçerseniz sonuç sayfası <code>/orders/confirm</code> çağırıp siparişi kesinleştirir.
    </p>
  </div>
</body></html>`;

      // ÖNEMLİ: Artık HTML'i direkt dönmüyoruz; JSON ile gönderiyoruz
      return res.json({ mode: "mock", html });
    }

    // ---- GERÇEK PAYTR AKIŞI ----
    // Kayıtlı kullanıcı varsa user, yoksa guest üzerinden bilgileri hazırla
    const user = order.user ? await User.findById(order.user).lean() : null;

    // ENV'leri trimleyerek al
    const MERCHANT_ID = (process.env.PAYTR_MERCHANT_ID || "").trim();
    const MERCHANT_KEY = (process.env.PAYTR_MERCHANT_KEY || "").trim();
    const MERCHANT_SALT = (process.env.PAYTR_MERCHANT_SALT || "").trim();
    const TEST_MODE = (process.env.PAYTR_TEST_MODE || "1").trim(); // "1"/"0"

    const user_ip = getClientIp(req);

    // PayTR zorunluluğu: sadece alfanümerik, makul uzunluk
    const merchant_oid = String(order.conversationId || "")
      .replace(/[^A-Za-z0-9]/g, "")
      .slice(0, 64);

    // ←←← GÜNCEL KISIM: email / isim / telefon / adres seçimleri
    const email = user?.email || order.guest?.email || "fallback@example.com";
    const user_name = user
      ? `${user.firstName || "Müşteri"} ${user.lastName || ""}`.trim()
      : `${order.guest?.firstName || "Müşteri"} ${
          order.guest?.lastName || ""
        }`.trim();
    const user_phone = user?.phone || order.guest?.phone || "0000000000";
    const user_address = user
      ? `${order.address?.mainaddress || ""} ${
          order.address?.city || ""
        }`.trim()
      : `${
          order.guest?.registrationAddress || order.address?.mainaddress || ""
        } ${order.address?.city || ""}`.trim();

    const payment_amount = tlToKurus(order.totalPrice);

    const basket = (order.items || []).map((it) => [
      it.name,
      Number(it.price || 0).toFixed(2),
      Number(it.qty || 1),
    ]);
    const user_basket = Buffer.from(JSON.stringify(basket)).toString("base64");

    const no_installment = "0";
    const max_installment = "0";
    const currency = "TL";
    const non_3d = "0"; // Hash’e DAHİL değil

    // Hash (non_3d DAHİL değil)
    const hashStr =
      MERCHANT_ID +
      user_ip +
      merchant_oid +
      email +
      String(payment_amount) +
      user_basket +
      no_installment +
      max_installment +
      currency +
      TEST_MODE +
      MERCHANT_SALT;

    const paytr_token = crypto
      .createHmac("sha256", MERCHANT_KEY)
      .update(hashStr)
      .digest("base64");

    const okUrl = `${FRONTEND_BASE}/payment-result?status=success&conversationId=${merchant_oid}&paymentId=${merchant_oid}`;
    const failUrl = `${FRONTEND_BASE}/payment-result?status=failure&conversationId=${merchant_oid}`;

    // Form body
    const body = new URLSearchParams({
      merchant_id: MERCHANT_ID,
      merchant_key: MERCHANT_KEY, // opsiyonel ama sorun çıkarmaz
      merchant_salt: MERCHANT_SALT, // opsiyonel ama sorun çıkarmaz

      user_ip,
      merchant_oid,
      email,
      payment_amount: String(payment_amount),
      user_basket,
      no_installment,
      max_installment,
      currency,
      test_mode: TEST_MODE,
      non_3d,
      user_name,
      user_address,
      user_phone,
      merchant_ok_url: okUrl,
      merchant_fail_url: failUrl,
      timeout_limit: "30",
      debug_on: process.env.NODE_ENV === "production" ? "0" : "1",
      lang: "tr",
      paytr_token,
    });
    console.log(
      "[PAYTR][get-token] convId:",
      conversationId,
      "merchant_oid:",
      merchant_oid,
      "amount:",
      payment_amount
    );

    const resp = await fetch("https://www.paytr.com/odeme/api/get-token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    const rawText = await resp.text();
    console.log("[PAYTR][get-token][resp]", rawText.slice(0, 200));

    let data = null;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = null;
    }
    if (!resp.ok || !data) {
      console.error(
        "[PAYTR][raw-response]",
        resp.status,
        rawText.slice(0, 600)
      );
    }

    if (!data || data.status !== "success" || !data.token) {
      safeLogPaytrInput({
        reason: (data && data.reason) || "unknown",
        merchant_id: MERCHANT_ID,
        user_ip,
        merchant_oid,
        email,
        payment_amount: String(payment_amount),
        test_mode: TEST_MODE === "1" ? 1 : 0,
        non_3d,
        currency,
        okUrl,
        failUrl,
        user_name,
        user_basket: user_basket,
        paytr_token_len: paytr_token?.length || 0,
      });

      console.error("[PAYTR][get-token] Hata:", data || rawText);
      return res.status(500).json({
        message: (data && data.reason) || "Ödeme başlatılamadı (PayTR).",
      });
    }

    // ÖNEMLİ: Artık HTML döndürmüyoruz; sadece token
    return res.json({ mode: "paytr", token: data.token });
  } catch (e) {
    console.error("[PAYTR][inline] Hata:", e);
    res.status(500).json({ message: "Ödeme başlatılamadı (server)." });
  }
};

/** MOCK tamamla (sadece geliştirme) */
exports.mockComplete = async (req, res) => {
  try {
    const { conversationId } = req.body || {};
    if (!conversationId) {
      return res.status(400).json({ message: "Eksik parametre." });
    }

    const order = await Order.findOneAndUpdate(
      { conversationId },
      {
        status: "paid",
        paymentId: `mock_${conversationId}`,
        adminSeenAt: null,
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Sipariş bulunamadı." });
    }

    // Opsiyonel: mock akışında mail de gönder (dev/test için faydalı)
    if (!order.orderMailSentAt) {
      try {
        await sendOrderPlacedMail(order);
        order.orderMailSentAt = new Date();
        await order.save();
      } catch (e) {
        console.warn("[PAYMENT][mock-complete] mail error:", e?.message || e);
      }
    }

    return res.json({ ok: true });
  } catch (e) {
    console.error("[PAYMENT][mock-complete] Hata:", e);
    return res.status(500).json({ message: "Mock tamamlama başarısız." });
  }
};

/** 3) PAYTR postback (panelde ayarlarsın) */
exports.paytrCallback = async (req, res) => {
  try {
    const { merchant_oid, status, total_amount, hash } = req.body || {};
    const KEY = (process.env.PAYTR_MERCHANT_KEY || "").trim();
    const SALT = (process.env.PAYTR_MERCHANT_SALT || "").trim();

    if (!merchant_oid) return res.status(400).send("BAD REQUEST");
    if (!KEY || !SALT) return res.send("OK"); // mock ortam

    const check = crypto
      .createHmac("sha256", KEY)
      .update(merchant_oid + SALT + status + total_amount)
      .digest("base64");

    if (check !== hash) return res.status(400).send("BAD REQUEST");

    if (status === "success") {
      const order = await Order.findOne({ conversationId: merchant_oid });
      if (!order) return res.send("OK");

      // ➊ tutar doğrulaması (kuruş bazında)
      const expected = Math.round(Number(order.totalPrice || 0) * 100);
      if (Number(total_amount) !== expected) {
        console.warn("[PAYTR][callback] Amount mismatch", {
          merchant_oid,
          fromPaytr: total_amount,
          expected,
        });
        // İstersen burada 'cancelled' yap veya alarm üret:
        return res.send("OK");
      }

      // ➋ idempotency: zaten paid ise / stok düşmüşse tekrar dokunma
      if (order.status === "paid" && order.stockUpdated) {
        return res.send("OK");
      }

      // State güncelle
      order.status = "paid";
      order.paymentId = merchant_oid;
      order.adminSeenAt = null;

      // Stok düş
      try {
        await applyStockChanges(order);
        order.stockUpdated = true;
      } catch (e) {
        console.error("[PAYTR][callback] stock error:", e);
      }

      // Mail (tek sefer)
      if (!order.orderMailSentAt) {
        try {
          await sendOrderPlacedMail(order);
          order.orderMailSentAt = new Date();
        } catch (e) {
          console.warn(
            "[PAYTR][callback] order mail send error:",
            e?.message || e
          );
        }
      }

      // Tek sefer kayıt
      await order.save();
    } else {
      await Order.deleteOne({ conversationId: merchant_oid }).catch(() => {});
    }
    return res.send("OK");
  } catch (e) {
    console.error("[PAYTR][callback] Hata:", e);
    return res.status(500).send("OK");
  }
};
