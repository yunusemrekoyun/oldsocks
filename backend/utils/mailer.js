// backend/utils/mailer.js
const nodemailer = require("nodemailer");

// ENV
const from = process.env.MAIL_FROM;
const pass = process.env.MAIL_PASS;
const fallbackTo = process.env.MAIL_TO || from;
const adminList =
  (process.env.ADMIN_EMAILS || fallbackTo || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

// Gmail transporter (senin haliyle)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: from, pass },
});

/* -------------------- yardımcılar -------------------- */
const fmt = (n) => `₺${Number(n || 0).toFixed(2)}`;

function safeSend(opts) {
  if (!from || !pass) {
    console.warn("[mailer] MAIL_FROM / MAIL_PASS yok; mail gönderilmedi.");
    return Promise.resolve();
  }
  return transporter.sendMail({
    from: `"Oldsocks" <${from}>`,
    ...opts,
  });
}

/* -------------------- SİPARİŞ (mevcut) -------------------- */
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
  const customer = order.customer || order.user || {};

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

async function sendOrderPlacedMail(order, to = fallbackTo) {
  const subject = `Yeni Sipariş: #${order.orderNumber || order._id}`;
  const html = buildOrderHtml(order);
  await safeSend({ to, subject, html });
}

/* -------------------- YENİ: Yorum/Yanıt mailleri -------------------- */
/* İstersen daha şık şablonlar için emailTemplates kullan:
   const { pendingCommentTemplate, pendingReplyTemplate } = require("./emailTemplates");
   Aşağıdaki minimalist html zaten iş görür. */

function buildPendingCommentHtml({ comment, post }) {
  return `
  <div style="font-family:Arial, Helvetica, sans-serif; max-width:640px; margin:auto;">
    <h2 style="margin:0 0 8px 0;">Onay Bekleyen Yorum</h2>
    <p style="margin:0 0 8px 0; color:#555;"><b>Gönderi:</b> ${post?.title || "-"}</p>
    <p style="margin:0 0 8px 0; color:#555;"><b>Yazan:</b> ${comment?.authorName || comment?.authorEmail || "Ziyaretçi"}</p>
    <div style="margin-top:8px; padding:12px; border:1px solid #eee; border-radius:8px; background:#fafafa;">
      ${String(comment?.content || "").slice(0, 600)}
    </div>
  </div>`;
}

function buildPendingReplyHtml({ reply, post, parentComment }) {
  return `
  <div style="font-family:Arial, Helvetica, sans-serif; max-width:640px; margin:auto;">
    <h2 style="margin:0 0 8px 0;">Onay Bekleyen Yanıt</h2>
    <p style="margin:0 0 8px 0; color:#555;"><b>Gönderi:</b> ${post?.title || "-"}</p>
    <p style="margin:0 0 8px 0; color:#555;"><b>Yanıtlayan:</b> ${reply?.authorName || reply?.authorEmail || "Ziyaretçi"}</p>

    <div style="margin:10px 0 6px; font-size:12px; color:#777;">Yanıtlanan yorum</div>
    <div style="margin:0 0 10px; padding:10px; border:1px dashed #ddd; border-radius:6px;">
      ${String(parentComment?.content || "").slice(0, 400)}
    </div>

    <div style="margin:10px 0 6px; font-size:12px; color:#777;">Yanıt</div>
    <div style="margin:0 0 10px; padding:12px; border:1px solid #eee; border-radius:6px; background:#fafafa;">
      ${String(reply?.content || "").slice(0, 600)}
    </div>
  </div>`;
}

/** Admin(ler)e “onay bekleyen yorum” bildirimi gönderir */
async function sendPendingCommentMail({ comment, post }) {
  const subject = "Onay Bekleyen Yorum";
  const html = buildPendingCommentHtml({ comment, post });
  const to = adminList.length ? adminList : [fallbackTo];
  await safeSend({ to, subject, html });
}

/** Admin(ler)e “onay bekleyen yanıt” bildirimi gönderir */
async function sendPendingReplyMail({ reply, post, parentComment }) {
  const subject = "Onay Bekleyen Yanıt";
  const html = buildPendingReplyHtml({ reply, post, parentComment });
  const to = adminList.length ? adminList : [fallbackTo];
  await safeSend({ to, subject, html });
}

module.exports = {
  // mevcut
  sendOrderPlacedMail,

  // yeni
  sendPendingCommentMail,
  sendPendingReplyMail,
};