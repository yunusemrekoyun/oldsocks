const NewsletterSubscriber = require("../models/NewsletterSubscriber");

exports.subscribe = async (req, res) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: "Geçerli bir e-posta girin." });
    }

    // upsert: varsa dokunma, yoksa oluştur
    const doc = await NewsletterSubscriber.findOneAndUpdate(
      { email },
      { $setOnInsert: { email } },
      { upsert: true, new: true }
    );

    return res.json({ message: "Abonelik kaydedildi.", subscriber: doc });
  } catch (err) {
    // eşsiz kısıt çakışmaları vs.
    return res.status(200).json({ message: "Zaten abonesiniz." });
  }
};

// (opsiyonel) admin listele
exports.list = async (req, res) => {
  const subs = await NewsletterSubscriber.find().sort({ createdAt: -1 });
  res.json(subs);
};
