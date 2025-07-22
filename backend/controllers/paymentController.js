const iyzipay = require("../config/iyzico");
const { v4: uuidv4 } = require("uuid");
const User = require("../models/User");
const Order = require("../models/Order");
const fallbackData = require("../config/fallback.json");

exports.createPaymentRedirect = async (req, res) => {
  try {
    const { cartItems, totalPrice, addressId, useFallback } = req.body;
    const userId = req.user.userId;
    const userDoc = await User.findById(userId).lean();

    // 1) Adres seçim / fallback
    let addr = userDoc.addresses?.find((a) => a._id.toString() === addressId) ||
      userDoc.addresses?.[0] || {
        title: "Varsayılan Adres",
        mainaddress: fallbackData.registrationAddress,
        street: "",
        district: "",
        city: fallbackData.city,
        postalCode: "",
      };

    // 2) Eksik müşteri bilgileri
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

    // 3) Eksik var, fallback onayı yok → 206 ile dön
    if (!useFallback && missing.length > 0) {
      return res.status(206).json({
        message: "Eksik kullanıcı verisi var.",
        missing,
        fallbackData,
      });
    }

    // 4) Pending sipariş kaydı
    const conversationId = uuidv4();
    const orderNumber = Math.floor(1e9 + Math.random() * 9e9).toString();
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

    // 5) Iyzico’ya yollanacak sepet formatı
    const basketItems = cartItems.map((it) => ({
      id: it.id,
      price: (it.price * it.qty).toFixed(2),
      name: it.name,
      category1: it.category || "Genel",
      itemType: "PHYSICAL",
      quantity: it.qty,
    }));

    // 6) Iyzico create isteği
    const request = {
      locale: "tr",
      conversationId,
      price: totalPrice.toFixed(2),
      paidPrice: totalPrice.toFixed(2),
      currency: "TRY",
      basketId: uuidv4(),
      paymentGroup: "PRODUCT",
      // callback’e conversationId de ekliyoruz:
      callbackUrl: `${process.env.BACKEND_ORIGIN}/api/v1/payment/callback?conversationId=${conversationId}`,
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
        // Ödeme başlatılamadı → pending kaydı silebiliriz
        Order.deleteOne({ conversationId }).catch(console.error);
        return res.status(500).send("Ödeme başlatılamadı.");
      }
      // Başarılı → form HTML’i dön
      res.send(`
        <!DOCTYPE html><html lang="tr"><head><meta charset="utf-8"/></head><body>
          ${result.checkoutFormContent}
          <script>document.querySelector('form').submit();</script>
        </body></html>
      `);
    });
  } catch (e) {
    console.error(e);
    res.status(500).send("Sunucu hatası.");
  }
};

exports.paymentCallback = async (req, res) => {
  const token = req.query.token || req.body.token;
  const convFromQuery = req.query.conversationId;
  if (!token) {
    const msg = encodeURIComponent("Token gönderilmesi zorunludur");
    return res.redirect(
      `${process.env.FRONTEND_ORIGIN}/payment-result?status=failure&message=${msg}`
    );
  }

  iyzipay.checkoutForm.retrieve(
    { locale: "tr", token },
    async (err, result) => {
      // başarısız ödeme → pending kaydı sil
      if (err || result.status !== "success") {
        const convId = convFromQuery || (result && result.conversationId);
        if (convId) {
          await Order.deleteOne({ conversationId: convId }).catch(
            console.error
          );
        }
        const msg = encodeURIComponent(
          (err || result).errorMessage || "Ödeme başarısız"
        );
        return res.redirect(
          `${process.env.FRONTEND_ORIGIN}/payment-result?status=failure&message=${msg}`
        );
      }

      // başarılı ödeme → db güncelle
      const paymentId = result.paymentId || result.paymentTransactionId;
      const conversationId = convFromQuery || result.conversationId;
      await Order.findOneAndUpdate(
        { conversationId },
        { paymentId, status: "paid" }
      );

      // redirect’e tüm parametreleri ekle
      const params = new URLSearchParams({
        status: "success",
        paymentId,
        conversationId,
      });
      return res.redirect(
        `${process.env.FRONTEND_ORIGIN}/payment-result?${params.toString()}`
      );
    }
  );
};
