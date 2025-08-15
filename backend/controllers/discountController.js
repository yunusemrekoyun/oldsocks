const mongoose = require("mongoose");
const Discount = require("../models/Discount");
const Product = require("../models/Product");
const Category = require("../models/Category");

/* ================== Yardımcılar ================== */

const oid = (x) => new mongoose.Types.ObjectId(String(x || ""));

// Artık sadece isActive’e bakıyoruz
const isActiveNow = (d) => Boolean(d.isActive);

// Kök kategorilerden tüm alt dalları (descendants) topla
async function getDescendantCategoryIds(rootIds) {
  const seen = new Set(rootIds.map(String));
  let frontier = [...rootIds];

  while (frontier.length) {
    const children = await Category.find({ parent: { $in: frontier } })
      .select("_id")
      .lean();
    const newOnes = [];
    for (const c of children) {
      const id = String(c._id);
      if (!seen.has(id)) {
        seen.add(id);
        newOnes.push(c._id);
      }
    }
    frontier = newOnes;
  }
  return Array.from(seen).map((s) => new mongoose.Types.ObjectId(s));
}

// Kurala göre etkilenen ürün id’lerini getir
async function getAffectedProductIds(rule) {
  if (rule.selectionType === "product") {
    return rule.targetIds;
  }

  if (rule.selectionType === "subcategory") {
    const prods = await Product.find({
      category: { $in: rule.targetIds },
    }).select("_id");
    return prods.map((p) => p._id);
  }

  if (rule.selectionType === "category") {
    const allCats = await getDescendantCategoryIds(rule.targetIds);
    const prods = await Product.find({ category: { $in: allCats } }).select(
      "_id"
    );
    return prods.map((p) => p._id);
  }

  return [];
}

// Çakışma: başka aktif indirim aynı ürünü tutuyor mu?
async function findConflicts(discountId, targetProductIds) {
  const others = await Discount.find({
    _id: { $ne: discountId },
    isActive: true,
  })
    .select("appliedProducts.product")
    .lean();
  const locked = new Set(
    others.flatMap((d) =>
      (d.appliedProducts || []).map((ap) => String(ap.product))
    )
  );
  const conflicts = targetProductIds.filter((id) => locked.has(String(id)));
  return conflicts;
}

/* ================== Uygula / Geri Al ================== */

async function applyDiscount(discount) {
  const rate = Number(discount.discountRate || 0) || 0;
  const productIds = await getAffectedProductIds(discount);

  // Çakışma kontrolü
  const conflicts = await findConflicts(discount._id, productIds);
  if (conflicts.length) {
    const err = new Error("Çakışan aktif indirim(ler) var.");
    err.status = 409;
    err.details = { conflictingProductIds: conflicts };
    throw err;
  }

  if (!productIds.length) {
    discount.appliedProducts = [];
    await discount.save();
    return { applied: 0 };
  }

  // Önceki manual indirimi kaydet
  const products = await Product.find({ _id: { $in: productIds } })
    .select("_id discount")
    .lean();

  const factor = (100 - rate) / 100;
  await Product.updateMany({ _id: { $in: productIds } }, [
    {
      $set: {
        discount: rate,
        price: { $round: [{ $multiply: ["$originalPrice", factor] }, 2] },
      },
    },
  ]);

  discount.appliedProducts = products.map((p) => ({
    product: p._id,
    previousDiscount: Number(p.discount || 0),
  }));
  await discount.save();

  return { applied: products.length };
}

async function unapplyDiscount(discount) {
  const applied = discount.appliedProducts || [];
  if (!applied.length) return { reverted: 0 };

  const ops = [];
  for (const ap of applied) {
    const prev = Number(ap.previousDiscount || 0);
    const factorPrev = (100 - prev) / 100;
    ops.push({
      updateOne: {
        filter: { _id: ap.product },
        update: [
          {
            $set: {
              discount: prev,
              price: {
                $round: [{ $multiply: ["$originalPrice", factorPrev] }, 2],
              },
            },
          },
        ],
      },
    });
  }
  if (ops.length) await Product.bulkWrite(ops);

  const reverted = applied.length;
  discount.appliedProducts = [];
  await discount.save();
  return { reverted };
}

/* ================== CRUD ================== */

// POST /discounts
exports.createDiscount = async (req, res) => {
  try {
    const {
      title,
      discountRate,
      selectionType, // "product" | "category" | "subcategory"
      targetIds = [],
      isActive = false,
    } = req.body;

    if (!title?.trim())
      return res.status(400).json({ message: "İndirim adı zorunlu." });
    if (discountRate == null)
      return res.status(400).json({ message: "İndirim yüzdesi zorunlu." });
    if (!["product", "category", "subcategory"].includes(selectionType)) {
      return res.status(400).json({ message: "Geçersiz selectionType." });
    }
    if (!Array.isArray(targetIds) || targetIds.length === 0) {
      return res.status(400).json({ message: "targetIds boş olamaz." });
    }

    const doc = await Discount.create({
      title: title.trim(),
      discountRate: Number(discountRate),
      selectionType,
      targetIds: targetIds.map(oid),
      isActive: Boolean(isActive),
      appliedProducts: [],
    });

    if (isActiveNow(doc)) {
      await applyDiscount(doc);
    }

    res.status(201).json(doc);
  } catch (err) {
    console.error("createDiscount error:", err);
    if (err.status === 409) {
      return res.status(409).json({ message: err.message, ...err.details });
    }
    res.status(500).json({ message: "İndirim oluşturulamadı." });
  }
};

// GET /discounts
exports.listDiscounts = async (_req, res) => {
  const list = await Discount.find().sort("-createdAt");
  res.json(list);
};

// GET /discounts/:id
exports.getDiscount = async (req, res) => {
  const d = await Discount.findById(req.params.id);
  if (!d) return res.status(404).json({ message: "İndirim bulunamadı." });
  res.json(d);
};

// PUT /discounts/:id  (alanları güncelle + uzlaştır)
exports.updateDiscount = async (req, res) => {
  try {
    const d = await Discount.findById(req.params.id);
    if (!d) return res.status(404).json({ message: "İndirim bulunamadı." });

    const wasActive = isActiveNow(d);

    // Alanları güncelle
    if (req.body.title !== undefined)
      d.title = String(req.body.title || "").trim();
    if (req.body.discountRate !== undefined)
      d.discountRate = Number(req.body.discountRate);
    if (req.body.selectionType !== undefined)
      d.selectionType = req.body.selectionType;
    if (req.body.targetIds !== undefined)
      d.targetIds = req.body.targetIds.map(oid);
    if (req.body.isActive !== undefined)
      d.isActive = Boolean(req.body.isActive);

    await d.save();

    const isActiveAfter = isActiveNow(d);

    // 1) Eskiden aktifti, artık değil → geri al
    if (wasActive && !isActiveAfter) {
      await unapplyDiscount(d);
      return res.json(d);
    }

    // 2) Eskiden pasifti, şimdi aktif → uygula
    if (!wasActive && isActiveAfter) {
      await applyDiscount(d);
      return res.json(d);
    }

    // 3) İki durumda da aktif → hedef set ve oranı senkronize et
    if (isActiveAfter) {
      const newIds = (await getAffectedProductIds(d)).map(String);
      const appliedIds = new Set(
        (d.appliedProducts || []).map((ap) => String(ap.product))
      );

      const toRemove = (d.appliedProducts || []).filter(
        (ap) => !newIds.includes(String(ap.product))
      );
      const toKeepIds = (d.appliedProducts || [])
        .filter((ap) => newIds.includes(String(ap.product)))
        .map((ap) => ap.product);
      const toAddIds = newIds.filter((id) => !appliedIds.has(id)).map(oid);

      // 3a) Setten çıkanları geri al
      if (toRemove.length) {
        const ops = [];
        for (const ap of toRemove) {
          const prev = Number(ap.previousDiscount || 0);
          const factorPrev = (100 - prev) / 100;
          ops.push({
            updateOne: {
              filter: { _id: ap.product },
              update: [
                {
                  $set: {
                    discount: prev,
                    price: {
                      $round: [
                        { $multiply: ["$originalPrice", factorPrev] },
                        2,
                      ],
                    },
                  },
                },
              ],
            },
          });
        }
        if (ops.length) await Product.bulkWrite(ops);
        d.appliedProducts = (d.appliedProducts || []).filter((ap) =>
          newIds.includes(String(ap.product))
        );
      }

      // 3b) Eklenecekler için çakışma + uygula
      if (toAddIds.length) {
        const conflicts = await findConflicts(d._id, toAddIds);
        if (conflicts.length) {
          const err = new Error("Çakışan aktif indirim(ler) var.");
          err.status = 409;
          err.details = { conflictingProductIds: conflicts };
          throw err;
        }

        const newProducts = await Product.find({ _id: { $in: toAddIds } })
          .select("_id discount")
          .lean();

        if (newProducts.length) {
          const rate = Number(d.discountRate || 0);
          const factor = (100 - rate) / 100;

          await Product.updateMany({ _id: { $in: toAddIds } }, [
            {
              $set: {
                discount: rate,
                price: {
                  $round: [{ $multiply: ["$originalPrice", factor] }, 2],
                },
              },
            },
          ]);

          d.appliedProducts.push(
            ...newProducts.map((p) => ({
              product: p._id,
              previousDiscount: Number(p.discount || 0),
            }))
          );
        }
      }

      // 3c) Kalanlarda oran değiştiyse güncelle
      if (toKeepIds.length) {
        const rate = Number(d.discountRate || 0);
        const factor = (100 - rate) / 100;
        await Product.updateMany({ _id: { $in: toKeepIds } }, [
          {
            $set: {
              discount: rate,
              price: { $round: [{ $multiply: ["$originalPrice", factor] }, 2] },
            },
          },
        ]);
      }

      await d.save();
    }

    res.json(d);
  } catch (err) {
    console.error("updateDiscount error:", err);
    if (err.status === 409) {
      return res.status(409).json({ message: err.message, ...err.details });
    }
    res.status(500).json({ message: "İndirim güncellenemedi." });
  }
};

// PUT /discounts/:id/toggle  { isActive: true/false }
exports.toggleDiscount = async (req, res) => {
  try {
    const d = await Discount.findById(req.params.id);
    if (!d) return res.status(404).json({ message: "İndirim bulunamadı." });

    const wasActive = isActiveNow(d);

    d.isActive = Boolean(req.body.isActive);
    await d.save();

    const isActiveAfter = isActiveNow(d);

    if (wasActive && !isActiveAfter) await unapplyDiscount(d);
    else if (!wasActive && isActiveAfter) await applyDiscount(d);

    res.json(d);
  } catch (err) {
    console.error("toggleDiscount error:", err);
    if (err.status === 409) {
      return res.status(409).json({ message: err.message, ...err.details });
    }
    res.status(500).json({ message: "İndirim güncellenemedi." });
  }
};

// DELETE /discounts/:id
exports.deleteDiscount = async (req, res) => {
  try {
    const d = await Discount.findById(req.params.id);
    if (!d) return res.status(404).json({ message: "İndirim bulunamadı." });

    // aktifken silinirse geri al
    if (d.appliedProducts?.length) {
      await unapplyDiscount(d);
    }
    await Discount.findByIdAndDelete(d._id);
    res.json({ message: "İndirim silindi." });
  } catch (err) {
    console.error("deleteDiscount error:", err);
    res.status(500).json({ message: "İndirim silinemedi." });
  }
};
