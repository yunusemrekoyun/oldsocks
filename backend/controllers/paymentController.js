const iyzipay = require("../config/iyzico");
const { v4: uuidv4 } = require("uuid");
const User = require("../models/User");
const Order = require("../models/Order");
const fallbackData = require("../config/fallback.json");
const FRONTEND_BASE = (() => {
  const raw = process.env.FRONTEND_ORIGIN || "";
  const first = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)[0];
  return first || "http://localhost:5173"; // local fallback
})();
/** 1) XHR: Ödeme oturumunu başlat – DB’de pending sipariş + initialize payload’ı sakla */
exports.startPaymentSession = async (req, res) => {
  try {
    const { cartItems, totalPrice, addressId, useFallback } = req.body;
    const userId = req.user.userId;
    const userDoc = await User.findById(userId).lean();

    // Adres
    const addr = userDoc.addresses?.find(
      (a) => a._id.toString() === addressId
    ) ||
      userDoc.addresses?.[0] || {
        title: "Varsayılan Adres",
        mainaddress: fallbackData.registrationAddress,
        street: "",
        district: "",
        city: fallbackData.city,
        postalCode: "",
      };

    // Eksik müşteri bilgisi → fallback iste
    const missing = [];
    const name =
      userDoc.firstName ||
      (missing.push("firstName") && fallbackData.firstName);
    const surname =
      userDoc.lastName || (missing.push("lastName") && fallbackData.lastName);
    const gsmNumber =
      userDoc.phone || (missing.push("phone") && fallbackData.phone);
    const email =
      userDoc.email || (missing.push("email") && fallbackData.email);
    const identityNumber =
      userDoc.identityNumber ||
      (missing.push("identityNumber") && fallbackData.identityNumber);
    const registrationAddress =
      addr.mainaddress ||
      (missing.push("registrationAddress") && fallbackData.registrationAddress);
    const city = addr.city || (missing.push("city") && fallbackData.city);

    if (!useFallback && missing.length > 0) {
      return res.status(206).json({
        message: "Eksik kullanıcı verisi var.",
        missing,
        fallbackData,
      });
    }

    // Sepet
    const basketItems = cartItems.map((it) => ({
      id: it.id,
      price: (it.price * it.qty).toFixed(2),
      name: it.name,
      category1: it.category || "Genel",
      itemType: "PHYSICAL",
      quantity: it.qty,
    }));

    // Pending sipariş + initialize payload
    const conversationId = uuidv4();
    const orderNumber = Math.floor(1e9 + Math.random() * 9e9).toString();

    const iyzInit = {
      price: Number(totalPrice || 0).toFixed(2),
      paidPrice: Number(totalPrice || 0).toFixed(2),
      buyer: {
        id: userId,
        name,
        surname,
        gsmNumber,
        email,
        identityNumber,
        registrationAddress,
        ip: req.ip,
        city,
        country: "Turkey",
      },
      shippingAddress: {
        contactName: `${name} ${surname}`,
        city,
        country: "Turkey",
        address: registrationAddress,
      },
      billingAddress: {
        contactName: `${name} ${surname}`,
        city,
        country: "Turkey",
        address: registrationAddress,
      },
      basketItems,
      enabledInstallments: [1, 2, 3],
    };

    await Order.create({
      orderNumber,
      user: userId,
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
        title: addr.title,
        mainaddress: addr.mainaddress,
        street: addr.street,
        district: addr.district,
        city: addr.city,
        postalCode: addr.postalCode,
      },
      conversationId,
      status: "pending",
      iyzInit,
    });

    // Front sadece conversationId ile /payment sayfasına gidecek
    return res.json({
      conversationId,
      inlineUrl: `${process.env.BACKEND_PUBLIC_URL}/api/v1/payment/inline/${conversationId}`,
      forwardUrl: `${process.env.BACKEND_PUBLIC_URL}/api/v1/payment/forward/${conversationId}`, // istersen tam sayfa da kullan
    });
  } catch (e) {
    console.error("[Payment][start] Hata:", e);
    res.status(500).json({ message: "Ödeme başlatılamadı." });
  }
};

/** 2a) Embed: sadece checkoutFormContent dön (auto-submit yok) */
exports.inlineCheckoutHtml = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const order = await Order.findOne({ conversationId }).lean();
    if (!order || order.status !== "pending")
      return res.status(404).send("Geçersiz sipariş.");

    const r = order.iyzInit;
    if (!r) return res.status(400).send("Ödeme verileri eksik.");

    const request = {
      locale: "tr",
      conversationId,
      price: r.price,
      paidPrice: r.paidPrice,
      currency: "TRY",
      basketId: uuidv4(),
      paymentGroup: "PRODUCT",
      callbackUrl: `${process.env.BACKEND_PUBLIC_URL}/api/v1/payment/callback?conversationId=${conversationId}`,
      enabledInstallments: r.enabledInstallments || [1],
      buyer: r.buyer,
      shippingAddress: r.shippingAddress,
      billingAddress: r.billingAddress,
      basketItems: r.basketItems,
    };

    iyzipay.checkoutFormInitialize.create(request, async (err, result) => {
      if (err || result?.status !== "success") {
        await Order.deleteOne({ conversationId }).catch(() => {});
        return res.status(500).send("Ödeme başlatılamadı.");
      }
      res.type("text/html").send(result.checkoutFormContent);
    });
  } catch (e) {
    console.error("[Payment][inline] Hata:", e);
    res.status(500).send("Sunucu hatası.");
  }
};

/** 2b) Full-page (opsiyonel): auto-submit ile direkt İyzico’ya */
exports.forwardToIyzico = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const order = await Order.findOne({ conversationId }).lean();
    if (!order || order.status !== "pending")
      return res.status(404).send("Geçersiz sipariş.");

    const r = order.iyzInit;
    if (!r) return res.status(400).send("Ödeme verileri eksik.");

    const request = {
      locale: "tr",
      conversationId,
      price: r.price,
      paidPrice: r.paidPrice,
      currency: "TRY",
      basketId: uuidv4(),
      paymentGroup: "PRODUCT",
      callbackUrl: `${process.env.BACKEND_PUBLIC_URL}/api/v1/payment/callback?conversationId=${conversationId}`,
      enabledInstallments: r.enabledInstallments || [1],
      buyer: r.buyer,
      shippingAddress: r.shippingAddress,
      billingAddress: r.billingAddress,
      basketItems: r.basketItems,
    };

    iyzipay.checkoutFormInitialize.create(request, async (err, result) => {
      if (err || result?.status !== "success") {
        await Order.deleteOne({ conversationId }).catch(() => {});
        return res.status(500).send("Ödeme başlatılamadı.");
      }
      res.status(200).type("text/html")
        .send(`<!doctype html><html lang="tr"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head><body>
        ${result.checkoutFormContent}
        <script>try{var f=document.querySelector('form');if(f)f.submit()}catch(e){}</script>
      </body></html>`);
    });
  } catch (e) {
    console.error("[Payment][forward] Hata:", e);
    res.status(500).send("Sunucu hatası.");
  }
};

/** 3) İyzico dönüşü */
exports.paymentCallback = async (req, res) => {
  const token = req.query.token || req.body.token;
  const convFromQuery = req.query.conversationId;
  if (!token) {
    const msg = encodeURIComponent("Token gönderilmesi zorunludur");
    return res.redirect(
      `${FRONTEND_BASE}/payment-result?status=failure&message=${msg}`
    );
  }

  iyzipay.checkoutForm.retrieve(
    { locale: "tr", token },
    async (err, result) => {
      if (err || result.status !== "success") {
        const convId = convFromQuery || (result && result.conversationId);
        if (convId)
          await Order.deleteOne({ conversationId: convId }).catch(() => {});
        const msg = encodeURIComponent(
          (err || result).errorMessage || "Ödeme başarısız"
        );
        return res.redirect(
          `${FRONTEND_BASE}/payment-result?status=failure&message=${msg}`
        );
      }

      const paymentId = result.paymentId || result.paymentTransactionId;
      const conversationId = convFromQuery || result.conversationId;
      await Order.findOneAndUpdate(
        { conversationId },
        { paymentId, status: "paid", adminSeenAt: null }
      );

      const params = new URLSearchParams({
        status: "success",
        paymentId,
        conversationId,
      });
      return res.redirect(
        `${FRONTEND_BASE}/payment-result?${params.toString()}`
      );
    }
  );
};
