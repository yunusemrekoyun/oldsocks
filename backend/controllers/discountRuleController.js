// backend/controllers/discountRuleController.js
const mongoose = require("mongoose");
const DiscountRule = require("../models/DiscountRule");

// küçük yardımcı
const toObjectIdArray = (arr) =>
  (Array.isArray(arr) ? arr : [])
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter(Boolean)
    .map((s) => new mongoose.Types.ObjectId(s));

/* GET /discount-rules */
exports.list = async (req, res) => {
  try {
    const rules = await DiscountRule.find().sort("-createdAt");
    res.json(rules);
  } catch (e) {
    console.error("discountRules.list", e);
    res.status(500).json({ message: "Kurallar alınamadı." });
  }
};

/* POST /discount-rules */
exports.create = async (req, res) => {
  try {
    const {
      title,
      selectionType, // 'product'|'category'|'subcategory'
      targetIds,
      discountRate,
      overrideExisting,
      startAt,
      endAt,
    } = req.body;

    if (!title || !String(title).trim())
      return res.status(400).json({ message: "Başlık zorunludur." });

    if (!["product", "category", "subcategory"].includes(selectionType))
      return res.status(400).json({ message: "Geçersiz selectionType." });

    const ids = toObjectIdArray(targetIds);
    if (!ids.length)
      return res.status(400).json({ message: "targetIds boş bırakılamaz." });

    const rate = Number(discountRate);
    if (Number.isNaN(rate) || rate < 0 || rate > 100)
      return res.status(400).json({ message: "discountRate 0-100 arası olmalı." });

    const doc = await DiscountRule.create({
      title: String(title).trim(),
      selectionType,
      targetIds: ids,
      discountRate: rate,
      overrideExisting: !!overrideExisting,
      startAt: startAt ? new Date(startAt) : null,
      endAt: endAt ? new Date(endAt) : null,
      isActive: false,
    });

    res.status(201).json(doc);
  } catch (e) {
    console.error("discountRules.create", e);
    res.status(500).json({ message: "Kural oluşturulamadı." });
  }
};

/* PUT /discount-rules/:id */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      selectionType,
      targetIds,
      discountRate,
      overrideExisting,
      startAt,
      endAt,
      isActive,
    } = req.body;

    const updates = {};

    if (title !== undefined) {
      if (!String(title).trim())
        return res.status(400).json({ message: "Başlık boş olamaz." });
      updates.title = String(title).trim();
    }

    if (selectionType !== undefined) {
      if (!["product", "category", "subcategory"].includes(selectionType))
        return res.status(400).json({ message: "Geçersiz selectionType." });
      updates.selectionType = selectionType;
    }

    if (targetIds !== undefined) {
      const ids = toObjectIdArray(targetIds);
      if (!ids.length)
        return res.status(400).json({ message: "targetIds boş bırakılamaz." });
      updates.targetIds = ids;
    }

    if (discountRate !== undefined) {
      const rate = Number(discountRate);
      if (Number.isNaN(rate) || rate < 0 || rate > 100)
        return res.status(400).json({ message: "discountRate 0-100 arası olmalı." });
      updates.discountRate = rate;
    }

    if (overrideExisting !== undefined)
      updates.overrideExisting = !!overrideExisting;

    if (startAt !== undefined)
      updates.startAt = startAt ? new Date(startAt) : null;

    if (endAt !== undefined) updates.endAt = endAt ? new Date(endAt) : null;

    if (isActive !== undefined) updates.isActive = !!isActive;

    const doc = await DiscountRule.findByIdAndUpdate(id, updates, { new: true });
    if (!doc) return res.status(404).json({ message: "Kural bulunamadı." });

    res.json(doc);
  } catch (e) {
    console.error("discountRules.update", e);
    res.status(500).json({ message: "Kural güncellenemedi." });
  }
};

/* DELETE /discount-rules/:id */
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const del = await DiscountRule.findByIdAndDelete(id);
    if (!del) return res.status(404).json({ message: "Kural bulunamadı." });
    res.json({ message: "Kural silindi." });
  } catch (e) {
    console.error("discountRules.remove", e);
    res.status(500).json({ message: "Kural silinemedi." });
  }
};

/* PATCH /discount-rules/:id/activate
   Not: örnek implementasyon — sadece seçilen kuralı aktif eder,
        dilersek “aynı tip ve aynı hedeflerde çakışmaları” ayrıca ele alabiliriz. */
exports.activate = async (req, res) => {
  try {
    const { id } = req.params;

    // İstersen tüm kuralları pasife çek:
    // await DiscountRule.updateMany({}, { $set: { isActive: false } });

    const doc = await DiscountRule.findByIdAndUpdate(
      id,
      { $set: { isActive: true } },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: "Kural bulunamadı." });

    res.json({ message: "Aktifleştirildi.", rule: doc });
  } catch (e) {
    console.error("discountRules.activate", e);
    res.status(500).json({ message: "Kural aktifleştirilemedi." });
  }
};