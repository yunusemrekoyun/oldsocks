const nodemailer = require("nodemailer");

// ENV
const from = process.env.MAIL_FROM;
const pass = process.env.MAIL_PASS;
const fallbackTo = process.env.MAIL_TO || from;
const adminList = (process.env.ADMIN_EMAILS || fallbackTo || "")
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
          <td style="padding:8px 0;border-bottom:1px solid #eee;">${
            it.name
          }${size}${color}</td>
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
          <td style="padding-top:12px;" align="right"><strong>${fmt(
            order.totalPrice
          )}</strong></td>
        </tr>
      </tfoot>
    </table>

    <div style="margin-top:18px; padding-top:12px; border-top:1px solid #eee;">
      <h3 style="margin:0 0 6px 0;">Müşteri / Teslimat</h3>
      <p style="margin:0; color:#555;">
        ${customer.name || customer.fullName || "-"}<br/>
        ${order.email || customer.email || "-"}<br/>
        ${addr.phone || order.phone || "-"}<br/>
        ${addr.addressLine1 || addr.address || "-"} ${
    addr.addressLine2 || ""
  }<br/>
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
function buildPendingCommentHtml({ comment, post }) {
  return `
  <div style="font-family:Arial, Helvetica, sans-serif; max-width:640px; margin:auto;">
    <h2 style="margin:0 0 8px 0;">Onay Bekleyen Yorum</h2>
    <p style="margin:0 0 8px 0; color:#555;"><b>Gönderi:</b> ${
      post?.title || "-"
    }</p>
    <p style="margin:0 0 8px 0; color:#555;"><b>Yazan:</b> ${
      comment?.authorName || comment?.authorEmail || "Ziyaretçi"
    }</p>
    <div style="margin-top:8px; padding:12px; border:1px solid #eee; border-radius:8px; background:#fafafa;">
      ${String(comment?.content || "").slice(0, 600)}
    </div>
  </div>`;
}

function buildPendingReplyHtml({ reply, post, parentComment }) {
  return `
  <div style="font-family:Arial, Helvetica, sans-serif; max-width:640px; margin:auto;">
    <h2 style="margin:0 0 8px 0;">Onay Bekleyen Yanıt</h2>
    <p style="margin:0 0 8px 0; color:#555;"><b>Gönderi:</b> ${
      post?.title || "-"
    }</p>
    <p style="margin:0 0 8px 0; color:#555;"><b>Yanıtlayan:</b> ${
      reply?.authorName || reply?.authorEmail || "Ziyaretçi"
    }</p>

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

async function sendPendingCommentMail({ comment, post }) {
  const subject = "Onay Bekleyen Yorum";
  const html = buildPendingCommentHtml({ comment, post });
  const to = adminList.length ? adminList : [fallbackTo];
  await safeSend({ to, subject, html });
}

async function sendPendingReplyMail({ reply, post, parentComment }) {
  const subject = "Onay Bekleyen Yanıt";
  const html = buildPendingReplyHtml({ reply, post, parentComment });
  const to = adminList.length ? adminList : [fallbackTo];
  await safeSend({ to, subject, html });
}

/* -------------------- YENİ: İletişim Formu -------------------- */
async function sendContactMail({ name, email, subject, message }) {
  const html = `
    <div style="font-family:Arial, Helvetica, sans-serif; max-width:640px; margin:auto;">
      <h2 style="margin:0 0 8px 0;">İletişim Formu</h2>
      <p style="margin:0 0 8px 0; color:#555;">
        <b>Gönderen:</b> ${name} &lt;${email}&gt;<br/>
        <b>Konu:</b> ${subject}
      </p>
      <div style="margin-top:8px; padding:12px; border:1px solid #eee; border-radius:8px; background:#fafafa; white-space:pre-wrap;">
        ${String(message || "").slice(0, 5000)}
      </div>
    </div>
  `;
  const to = adminList.length ? adminList : [fallbackTo];
  await safeSend({
    to,
    subject: `İletişim: ${subject}`,
    html,
    replyTo: email,
  });
}

/* -------------------- YENİ: Bülten – “Yeni Blog” maili -------------------- */
function buildNewsletterNewBlogHtml({ post, link }) {
  const title = post?.title || "Yeni Blog Yazısı";
  const excerpt =
    (post?.content &&
      String(post.content)
        .replace(/<[^>]+>/g, "")
        .slice(0, 200)) ||
    "";
  return `
    <div style="font-family:Arial, Helvetica, sans-serif; max-width:640px; margin:auto;">
      <h2 style="margin:0 0 10px 0;">${title}</h2>
      ${
        excerpt
          ? `<p style="margin:0 0 12px 0; color:#555;">${excerpt}...</p>`
          : ""
      }
      <a href="${link}" style="display:inline-block; padding:10px 16px; background:#125795; color:#fff; text-decoration:none; border-radius:6px;">
        Yazıyı Oku
      </a>
      <p style="margin-top:12px; font-size:12px; color:#888;">Oldsocks</p>
    </div>
  `;
}

async function sendNewsletterNewBlog(
  post,
  frontendOrigin,
  pathTemplate = "/blog/:id"
) {
  try {
    const NewsletterSubscriber = require("../models/NewsletterSubscriber");
    const subs = await NewsletterSubscriber.find().select("email -_id");
    if (!subs.length) return;

    const base = frontendOrigin || process.env.FRONTEND_ORIGIN || "";
    const path = (pathTemplate || "/blog/:id").replace(":id", String(post._id));
    const link = `${base}${path}`;

    const html = buildNewsletterNewBlogHtml({ post, link });
    const to = subs.map((s) => s.email);

    // Çok alıcıyı BCC'de gönderiyoruz (tek alıcı TO)
    await safeSend({
      to: to.slice(0, 1),
      bcc: to.slice(1),
      subject: `Yeni Blog: ${post.title || "Yeni Yazı"}`,
      html,
    });
  } catch (e) {
    console.warn("[mailer] sendNewsletterNewBlog hata:", e?.message || e);
  }
}

module.exports = {
  sendOrderPlacedMail,
  sendPendingCommentMail,
  sendPendingReplyMail,
  sendContactMail,
  sendNewsletterNewBlog,
};
