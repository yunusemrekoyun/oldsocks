// backend/controllers/paymentController.js
const iyzipay = require("../config/iyzico");
const { v4: uuidv4 } = require("uuid");
const User = require("../models/User");

exports.createPaymentRedirect = async (req, res) => {
  try {
    const { cartItems, totalPrice } = req.body;
    const userId = req.user.userId;
    const userDoc = await User.findById(userId).lean();

    // fallback değerler
    const fallback = {
      firstName: "Müşteri",
      lastName: "Soyad",
      phone: "+900000000000",
      email: "no-reply@fallback.com",
      identityNumber: "11111111111",
      address: { mainaddress: "Adres yok", city: "Şehir yok" },
    };
    const missing = [];
    const name =
      userDoc?.firstName || (missing.push("firstName") && fallback.firstName);
    const surname =
      userDoc?.lastName || (missing.push("lastName") && fallback.lastName);
    const gsmNumber =
      userDoc?.phone || (missing.push("phone") && fallback.phone);
    const email = userDoc?.email || (missing.push("email") && fallback.email);
    const identityNumber =
      userDoc?.identityNumber ||
      (missing.push("identityNumber") && fallback.identityNumber);
    const registrationAddress =
      userDoc?.address?.mainaddress ||
      (missing.push("registrationAddress") && fallback.address.mainaddress);
    const city =
      userDoc?.address?.city || (missing.push("city") && fallback.address.city);

    if (missing.length) {
      console.log(`[Iyzico] fallback kullanıldı: ${missing.join(", ")}`);
    }

    // Sepet satırlarını Iyzico formatına çevir
    const basketItems = cartItems.map((it) => ({
      id: it.id,
      price: (it.price * it.qty).toFixed(2),
      name: it.name,
      category1: it.category || "Genel",
      itemType: "PHYSICAL",
      quantity: it.qty,
    }));

    // Iyzico create request
    const request = {
      locale: "tr",
      conversationId: uuidv4(),
      price: totalPrice.toFixed(2),
      paidPrice: totalPrice.toFixed(2),
      currency: "TRY",
      basketId: uuidv4(),
      paymentGroup: "PRODUCT",
      // callback → Iyzico buraya token’la dönecek
      callbackUrl: `${process.env.BACKEND_ORIGIN}/api/v1/payment/callback`,
      enabledInstallments: [1, 2, 3],
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
    };

    iyzipay.checkoutFormInitialize.create(request, (err, result) => {
      if (err || result.status !== "success") {
        console.error("[Iyzico] create hata:", err || result);
        return res.status(500).send("Ödeme başlatılamadı.");
      }
      // Kullanıcıyı otomatik submit eden küçük HTML
      res.send(`
        <!DOCTYPE html>
        <html lang="tr">
          <head><meta charset="utf-8"/></head>
          <body>
            ${result.checkoutFormContent}
            <script>document.querySelector('form').submit();</script>
          </body>
        </html>
      `);
    });
  } catch (e) {
    console.error(e);
    res.status(500).send("Sunucu hatası.");
  }
};

exports.paymentCallback = async (req, res) => {
  // hem GET hem POST için token’ı al
  const token = req.query.token || req.body.token;
  console.log("[Iyzico Callback] method:", req.method);
  console.log("[Iyzico Callback] token:", token);

  if (!token) {
    const msg = encodeURIComponent("Token gönderilmesi zorunludur");
    return res.redirect(
      `${process.env.FRONTEND_ORIGIN}/payment-result?status=failure&message=${msg}`
    );
  }

  iyzipay.checkoutForm.retrieve({ locale: "tr", token }, (err, result) => {
    if (err || result.status !== "success") {
      const msg = encodeURIComponent(
        (err || result).errorMessage || "Ödeme başarısız"
      );
      return res.redirect(
        `${process.env.FRONTEND_ORIGIN}/payment-result?status=failure&message=${msg}`
      );
    }
    // Başarılıysa front’a yönlendir
    const paymentId = result.paymentId || result.paymentTransactionId;
    return res.redirect(
      `${process.env.FRONTEND_ORIGIN}/payment-result?status=success&paymentId=${paymentId}`
    );
  });
};
