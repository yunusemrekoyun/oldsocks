import publicApi from "../../publicApi";

// Ödeme ekranına geçişte stok bu tarayıcının siparişine ayrılır. Müşteri sepete veya
// ödeme adımına dönerse kendi ayrımı bırakılır; yoksa kendi ayırdığı son adet sepette
// "tükendi" görünür. Oturum kimliği yalnız bu tarayıcıda tutulur.
const KEY = "oldsocks.checkoutSession";
let pending = null;

export function rememberCheckout(conversationId) {
  try {
    if (conversationId) localStorage.setItem(KEY, conversationId);
  } catch {
    // Depolama kapalıysa ayrım süre dolunca kendiliğinden biter.
  }
}

export function previousCheckout() {
  try {
    return localStorage.getItem(KEY) || null;
  } catch {
    return null;
  }
}

export function forgetCheckout() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // yok say
  }
}

// Birden çok bileşen aynı anda çağırabilir; tek istek gider.
export function releaseOwnCheckout() {
  const conversationId = previousCheckout();
  if (!conversationId) return Promise.resolve(false);
  if (!pending) {
    pending = publicApi
      .post("/payment/release", { conversationId })
      .then(({ data }) => {
        forgetCheckout();
        return Boolean(data?.released);
      })
      .catch(() => false)
      .finally(() => {
        pending = null;
      });
  }
  return pending;
}
