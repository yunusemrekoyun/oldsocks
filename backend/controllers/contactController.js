// backend/controllers/contactController.js
const { sendContactMail } = require("../utils/mailer");

exports.sendContactMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body || {};
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: "Lütfen tüm alanları doldurun." });
    }

    await sendContactMail({ name, email, subject, message });
    return res.json({ ok: true, message: "Mesaj gönderildi." });
  } catch (err) {
    console.error("contactController/sendContactMessage", err);
    return res
      .status(500)
      .json({ message: "Mesaj gönderilirken bir hata oluştu." });
  }
};
