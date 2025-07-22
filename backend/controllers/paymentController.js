// backend/controllers/paymentController.js
const iyzipay = require("../config/iyzico");
const { v4: uuidv4 } = require("uuid");
const User = require("../models/User");
const Order = require("../models/Order");

exports.createPaymentRedirect = async (req, res) => {
  try {
    const { cartItems, totalPrice } = req.body;
    const userId = req.user.userId;
    const userDoc = await User.findById(userId).lean();

    // 1) Benzersiz ID’ler
    const conversationId = uuidv4();
    const orderNumber = Math.floor(
      1000000000 + Math.random() * 9000000000
    ).toString(); // 10 haneyi sağlar

    // 2) Adres
    let addr = userDoc.addresses?.[0] || {
      title: "Varsayılan Adres",
      mainaddress: userDoc.address?.mainaddress || "Adres yok",
      street: userDoc.address?.street || "",
      city: userDoc.address?.city || "Şehir yok",
      district: userDoc.address?.district || "",
      postalCode: userDoc.address?.postalCode || "",
    };

    // 3) “pending” durumda yeni sipariş kaydı
    await Order.create({
      orderNumber,
      user: userId,
      items: cartItems.map((it) => ({
        productId: it.id,
        name: it.name,
        price: it.price,
        qty: it.qty,
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
    });

    // 4) Fallback mantığı (mevcut kodundan alıntı)
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
      userDoc?.addresses?.[0]?.mainaddress ||
      (missing.push("registrationAddress") && fallback.address.mainaddress);
    const city =
      userDoc?.addresses?.[0]?.city ||
      (missing.push("city") && fallback.address.city);

    if (missing.length) {
      console.log(`[Iyzico] fallback kullanıldı: ${missing.join(", ")}`);
    }

    // 5) Sepet satırlarını Iyzico formatına çevir
    const basketItems = cartItems.map((it) => ({
      id: it.id,
      price: (it.price * it.qty).toFixed(2),
      name: it.name,
      category1: it.category || "Genel",
      itemType: "PHYSICAL",
      quantity: it.qty,
    }));

    // 6) Iyzico isteği
    const request = {
      locale: "tr",
      conversationId, // burada pending kayıttakiyle eşleşecek
      price: totalPrice.toFixed(2),
      paidPrice: totalPrice.toFixed(2),
      currency: "TRY",
      basketId: uuidv4(),
      paymentGroup: "PRODUCT",
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
      // Form’u otomatik submit eden HTML
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
  const token = req.query.token || req.body.token;
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

    const paymentId = result.paymentId || result.paymentTransactionId;
    const conversationId = result.conversationId; // bazen undefined olabilir

    // query param’leri güvenli oluştur
    const params = new URLSearchParams();
    params.set("status", "success");
    params.set("paymentId", paymentId);
    if (conversationId) params.set("conversationId", conversationId);

    return res.redirect(
      `${process.env.FRONTEND_ORIGIN}/payment-result?${params.toString()}`
    );
  });
};
