// backend/utils/mailer.js
const nodemailer = require("nodemailer");

const from = process.env.MAIL_FROM;
const pass = process.env.MAIL_PASS;

// Gmail transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: from, pass },
});

/**
 * Basit ₺ formatı
 */
const fmt = (n) => `₺${Number(n || 0).toFixed(2)}`;

/**
 * Sipariş maili HTML gövdesi
 */
function buildOrderHtml(order) {
  const itemsHtml = (order.items || [])
    .map((it) => {
      const size = it.size ? ` • Beden: ${it.size}` : "";
      const color = it.color ? ` • Renk: ${it.color}` : "";
      return `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee;">${it.name}${size}${color}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;" align="right">
            ${it.qty} × ${fmt(it.price)}
          </td>
        </tr>`;
    })
    .join("");

  const addr = order.shippingAddress || {};
  const customer = order.customer || order.user || {}; // backend’ine göre alan isimleri farklı olabilir

  return `
  <div style="font-family:Arial, Helvetica, sans-serif; max-width:640px; margin:auto;">
    <h2 style="margin:0 0 6px 0;">Yeni Sipariş</h2>
    <p style="margin:0 0 14px 0; color:#555;">
      Sipariş No: <strong>#${order.orderNumber || order._id}</strong><br/>
      Tarih: ${new Date(order.createdAt || Date.now()).toLocaleString("tr-TR")}
    </p>

    <table style="width:100%; border-collapse:collapse;">
      <thead>
        <tr>
          <th align="left" style="padding:8px 0; border-bottom:2px solid #000;">Ürün</th>
          <th align="right" style="padding:8px 0; border-bottom:2px solid #000;">Adet × Fiyat</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
      <tfoot>
        <tr>
          <td style="padding-top:12px;" align="left"><strong>Toplam</strong></td>
          <td style="padding-top:12px;" align="right"><strong>${fmt(order.totalPrice)}</strong></td>
        </tr>
      </tfoot>
    </table>

    <div style="margin-top:18px; padding-top:12px; border-top:1px solid #eee;">
      <h3 style="margin:0 0 6px 0;">Müşteri / Teslimat</h3>
      <p style="margin:0; color:#555;">
        ${customer.name || customer.fullName || "-"}<br/>
        ${order.email || customer.email || "-"}<br/>
        ${addr.phone || order.phone || "-"}<br/>
        ${addr.addressLine1 || addr.address || "-"} ${addr.addressLine2 || ""}<br/>
        ${addr.city || ""} ${addr.postalCode || ""} ${addr.country || ""}
      </p>
    </div>
  </div>`;
}

/**
 * Sipariş oluştuğunda admin’e mail at
 */
async function sendOrderPlacedMail(order, to = process.env.MAIL_TO || from) {
  if (!from || !pass) {
    console.warn("[mailer] MAIL_FROM / MAIL_PASS tanımlı değil, mail gönderilmedi.");
    return;
  }
  const subject = `Yeni Sipariş: #${order.orderNumber || order._id}`;
  const html = buildOrderHtml(order);
  await transporter.sendMail({
    from: `"Oldsocks" <${from}>`,
    to,
    subject,
    html,
  });
}

module.exports = {
  sendOrderPlacedMail,
};