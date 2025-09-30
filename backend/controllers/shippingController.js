const ShippingMethod = require("../models/ShippingMethod");

exports.list = async (_req, res) => {
  const rows = await ShippingMethod.find().sort({ createdAt: -1 }).lean();
  res.json(rows);
};

exports.create = async (req, res) => {
  const { name, fee, freeShippingThreshold } = req.body || {};
  if (!name?.trim())
    return res.status(400).json({ message: "Kargo adı zorunlu." });

  const doc = await ShippingMethod.create({
    name: name.trim(),
    fee: Number(fee ?? 0),
    freeShippingThreshold:
      freeShippingThreshold === null ||
      freeShippingThreshold === "" ||
      freeShippingThreshold === undefined
        ? null
        : Number(freeShippingThreshold),
  });
  res.status(201).json(doc);
};

exports.update = async (req, res) => {
  const { name, fee, freeShippingThreshold } = req.body || {};
  const updates = {};
  if (name !== undefined) updates.name = String(name).trim();
  if (fee !== undefined) updates.fee = Number(fee);
  if (freeShippingThreshold !== undefined) {
    updates.freeShippingThreshold =
      freeShippingThreshold === null || freeShippingThreshold === ""
        ? null
        : Number(freeShippingThreshold);
  }
  const doc = await ShippingMethod.findByIdAndUpdate(req.params.id, updates, {
    new: true,
  });
  if (!doc) return res.status(404).json({ message: "Bulunamadı." });
  res.json(doc);
};

exports.remove = async (req, res) => {
  const r = await ShippingMethod.findByIdAndDelete(req.params.id);
  if (!r) return res.status(404).json({ message: "Bulunamadı." });
  res.json({ ok: true });
};
