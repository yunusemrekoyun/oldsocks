import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardBody,
  Typography,
  Button,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Input,
  Tooltip,
  Checkbox,
} from "@material-tailwind/react";
import { PencilIcon, TrashIcon, CheckIcon } from "@heroicons/react/24/outline";
import api from "../../../api";
import ToastAlert from "../../components/ui/ToastAlert";

/* ───────────────── helpers ───────────────── */
const cx = (...cls) => cls.filter(Boolean).join(" ");

const Badge = ({ children, color = "gray" }) => {
  const map = {
    green: "bg-green-100 text-green-800",
    gray: "bg-gray-100 text-gray-700",
    blue: "bg-blue-100 text-blue-800",
    red: "bg-red-100 text-red-800",
    amber: "bg-amber-100 text-amber-800",
  };
  return (
    <span
      className={cx(
        "inline-flex items-center px-2 py-0.5 rounded text-xs",
        map[color]
      )}
    >
      {children}
    </span>
  );
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("tr-TR") : "—");
const toISO = (d) => {
  if (!d) return undefined;
  const dt = new Date(d);
  return isNaN(dt) ? undefined : dt.toISOString();
};

/** Kuralın etkileyeceği ürün sayısını hesapla */
const countImpacted = (rule, allProducts) => {
  if (!rule?.targetIds?.length) return 0;
  const set = new Set();

  if (rule.selectionType === "product") {
    rule.targetIds.forEach((id) => set.add(String(id)));
    return set.size;
  }

  const targetSet = new Set(rule.targetIds.map(String));
  for (const p of allProducts) {
    const cat = p.category;
    const pc = String(cat?._id || "");
    const pp = String(cat?.parent?._id || cat?.parent || "");
    if (rule.selectionType === "subcategory") {
      if (targetSet.has(pc)) set.add(String(p._id));
    } else {
      if (targetSet.has(pc) || (pp && targetSet.has(pp)))
        set.add(String(p._id));
    }
  }
  return set.size;
};

/* ───────────────── Page ───────────────── */
export default function DiscountsPage() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  const [options, setOptions] = useState({
    products: [],
    categories: [],
    subcategories: [],
  });

  // dialog & form
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState(null);

  // UI seçim tipi: 'product' | 'category' | 'subcategory'
  const [selectionType, setSelectionType] = useState("");

  const [form, setForm] = useState({
    _id: null,
    title: "",
    selectionType: "", // api ile birebir: 'product' | 'category' | 'subcategory'
    targetIds: [],
    discountRate: "",
    overrideExisting: true,
    startAt: "",
    endAt: "",
    isActive: false,
  });

  /* data fetch (rules + products + categories) */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [{ data: ruleList }, { data: prods }, { data: cats }] =
          await Promise.all([
            api.get("/discount-rules"),
            api.get("/products"),
            api.get("/categories"),
          ]);
        if (!alive) return;
        setRules(Array.isArray(ruleList) ? ruleList : []);
        setOptions({
          products: prods || [],
          categories: cats || [],
          subcategories: (cats || []).flatMap((c) => c.children || []),
        });
      } catch {
        setToast({
          type: "error",
          msg: "İndirim kuralları / veri yüklenemedi.",
        });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  /* mevcut seçim tipine göre seçenek listesi */
  const currentOptions = useMemo(() => {
    if (selectionType === "product") return options.products;
    if (selectionType === "category") return options.categories;
    if (selectionType === "subcategory") return options.subcategories;
    return [];
  }, [selectionType, options]);

  const selectionCount = form.targetIds.length;

  const previewRule = useMemo(
    () => ({
      selectionType: form.selectionType,
      targetIds: form.targetIds,
    }),
    [form.selectionType, form.targetIds]
  );

  const impactedCount = useMemo(
    () => countImpacted(previewRule, options.products),
    [previewRule, options.products]
  );

  /* dialog helpers */
  const resetForm = () => {
    setForm({
      _id: null,
      title: "",
      selectionType: "",
      targetIds: [],
      discountRate: "",
      overrideExisting: true,
      startAt: "",
      endAt: "",
      isActive: false,
    });
    setSelectionType("");
    setDirty(false);
  };

  const openNew = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (r) => {
    const uiType = r.selectionType; // 'product' | 'category' | 'subcategory'
    setSelectionType(uiType);
    setForm({
      _id: r._id,
      title: r.title || "",
      selectionType: r.selectionType,
      targetIds: r.targetIds || [],
      discountRate: r.discountRate ?? "",
      overrideExisting: Boolean(r.overrideExisting),
      startAt: r.startAt ? r.startAt.slice(0, 10) : "",
      endAt: r.endAt ? r.endAt.slice(0, 10) : "",
      isActive: Boolean(r.isActive),
    });
    setDirty(false);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (
      dirty &&
      !window.confirm("Kaydedilmemiş değişiklikler var. Kapatılsın mı?")
    )
      return;
    setDialogOpen(false);
  };

  /* validation */
  const isValid =
    form.title.trim().length > 0 &&
    !!form.selectionType &&
    selectionCount > 0 &&
    String(form.discountRate).trim() !== "" &&
    !Number.isNaN(Number(form.discountRate));

  /* crud */
  const refreshList = async () => {
    try {
      const { data } = await api.get("/discount-rules");
      setRules(Array.isArray(data) ? data : []);
    } catch {
      setToast({ type: "error", msg: "Liste yenilenemedi." });
    }
  };

  const toISO = (d) => {
    if (!d) return undefined;
    const dt = new Date(d);
    return isNaN(dt) ? undefined : dt.toISOString();
  };

  const saveRule = async () => {
    const targetIds = (form.targetIds || []).map(String).filter(Boolean);
    if (!form.selectionType || targetIds.length === 0) {
      setToast({ type: "error", msg: "Seçim türünü ve hedefleri belirtin." });
      return;
    }
    const payload = {
      title: (form.title || "").trim(),
      selectionType: form.selectionType, // 'product' | 'category' | 'subcategory'
      targetIds,
      discountRate: Number(form.discountRate),
      overrideExisting: !!form.overrideExisting,
      ...(toISO(form.startAt) ? { startAt: toISO(form.startAt) } : {}),
      ...(toISO(form.endAt) ? { endAt: toISO(form.endAt) } : {}),
    };

    try {
      if (form._id) {
        await api.put(
          `/discount-rules/${encodeURIComponent(form._id)}`,
          payload
        );
      } else {
        await api.post(`/discount-rules`, payload);
      }
      setToast({ type: "success", msg: "Kural kaydedildi." });
      setDialogOpen(false);
      await refreshList();
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        "Kural kaydedilemedi.";
      setToast({ type: "error", msg });
    }
  };

  const deleteRule = async (id) => {
    const rid = encodeURIComponent(id);
    try {
      await api.delete(`/discount-rules/${rid}`);
    } catch (e1) {
      if (e1?.response?.status === 404) {
        try {
          await api.delete(`/discount-rules`, { params: { id: rid } });
        } catch (e2) {
          const msg =
            e2?.response?.data?.message ||
            e2?.response?.data?.error ||
            "Kural silinemedi.";
          setToast({ type: "error", msg });
          return;
        }
      } else {
        const msg =
          e1?.response?.data?.message ||
          e1?.response?.data?.error ||
          "Kural silinemedi.";
        setToast({ type: "error", msg });
        return;
      }
    }
    setToast({ type: "success", msg: "Kural silindi." });
    await refreshList();
  };

  const activateRule = async (id) => {
    const rid = encodeURIComponent(id);
    try {
      await api.patch(`/discount-rules/${rid}/activate`);
    } catch (e1) {
      if (e1?.response?.status === 404) {
        try {
          await api.patch(`/discount-rules/activate/${rid}`);
        } catch (e2) {
          try {
            await api.post(`/discount-rules/${rid}/activate`);
          } catch (e3) {
            const msg =
              e3?.response?.data?.message ||
              e3?.response?.data?.error ||
              "Aktif etme başarısız.";
            setToast({ type: "error", msg });
            return;
          }
        }
      } else {
        const msg =
          e1?.response?.data?.message ||
          e1?.response?.data?.error ||
          "Aktif etme başarısız.";
        setToast({ type: "error", msg });
        return;
      }
    }
    setToast({ type: "success", msg: "Kural aktif edildi." });
    await refreshList();
  };

  if (loading) return <div className="p-6">Yükleniyor…</div>;

  return (
    <div className="space-y-6">
      {/* üst bar */}
      <div className="flex items-center justify-between">
        <div>
          <Typography variant="h4">İndirim Kuralları</Typography>
          <Typography variant="small" className="text-gray-600">
            Kategori/Alt Kategori/Ürün seçerek toplu indirim yönet.
          </Typography>
        </div>
        <Button color="blue" onClick={openNew}>
          + Yeni Kural
        </Button>
      </div>

      {/* liste */}
      {rules.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <Typography variant="h6" className="mb-2">
            Kural bulunamadı
          </Typography>
          <Typography className="text-gray-600 mb-4">
            Yeni bir indirim kuralı oluşturun.
          </Typography>
          <Button color="blue" onClick={openNew}>
            Kural Oluştur
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rules.map((r) => {
            const uiType =
              r.selectionType === "product"
                ? "Ürün"
                : r.selectionType === "subcategory"
                ? "Alt Kategori"
                : "Kategori";
            const affected = countImpacted(r, options.products);

            return (
              <Card
                key={r._id}
                className="relative border border-gray-100 hover:shadow-xl transition-shadow group"
              >
                {/* küçük hover edit butonu */}
                <button
                  onClick={() => openEdit(r)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10
                             inline-flex items-center gap-2 px-2 py-1 bg-white border rounded-lg shadow-sm text-xs"
                  title="Düzenle"
                >
                  <PencilIcon className="w-4 h-4" />
                  Düzenle
                </button>

                <CardBody className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Typography variant="h6" className="truncate">
                        {r.title || "Başlıksız Kural"}
                      </Typography>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge color={r.isActive ? "green" : "gray"}>
                          {r.isActive ? "Aktif" : "Pasif"}
                        </Badge>
                        <Badge color="blue">{uiType}-hedefli</Badge>
                        <span className="text-sm text-gray-700">
                          %{r.discountRate}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-gray-600">
                    {fmtDate(r.startAt)} → {fmtDate(r.endAt)}
                  </div>
                  <div className="text-xs text-gray-600">
                    Hedef sayısı: <b>{r.targetIds?.length || 0}</b> •
                    Etkilenecek ürün: <b>{affected}</b>
                  </div>
                  <div className="text-sm text-gray-700">
                    {r.overrideExisting
                      ? "Mevcut indirimi ezer"
                      : "Mevcut indirimi korur"}
                  </div>

                  {/* aksiyonlar */}
                  <div className="mt-3 flex items-center justify-end gap-2">
                    <Tooltip content="Aktif Yap">
                      <Button
                        size="sm"
                        variant="outlined"
                        className="px-3"
                        onClick={() => activateRule(r._id)}
                      >
                        <CheckIcon className="w-4 h-4" />
                      </Button>
                    </Tooltip>
                    <Tooltip content="Sil">
                      <Button
                        size="sm"
                        color="red"
                        variant="outlined"
                        className="px-3"
                        onClick={() => deleteRule(r._id)}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </Tooltip>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* dialog */}
      <Dialog
        open={dialogOpen}
        size="xl"
        handler={closeDialog}
        className="z-[1000]"
      >
        <DialogHeader>
          {form._id ? "Kuralı Düzenle" : "Yeni Kural Oluştur"}
        </DialogHeader>
        <DialogBody divider className="overflow-auto max-h-[75vh] pr-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SOL: FORM */}
            <div className="space-y-4">
              <Input
                label="Başlık *"
                value={form.title}
                onChange={(e) => {
                  setForm((f) => ({ ...f, title: e.target.value }));
                  setDirty(true);
                }}
                crossOrigin=""
              />

              <div>
                <label className="block mb-2 font-medium">Seçim Türü *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "product", label: "Ürün" },
                    { key: "category", label: "Kategori" },
                    { key: "subcategory", label: "Alt Kategori" },
                  ].map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => {
                        setSelectionType(t.key);
                        setForm((f) => ({
                          ...f,
                          selectionType: t.key, // 🔑 backend’in beklediği alan
                          targetIds: [], // seçim tipi değişince temizle
                        }));
                        setDirty(true);
                      }}
                      className={`border rounded-lg py-2 text-sm ${
                        selectionType === t.key
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {selectionType && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block font-medium">
                      {selectionType === "product"
                        ? "Ürünleri Seçin *"
                        : selectionType === "category"
                        ? "Kategorileri Seçin *"
                        : "Alt Kategorileri Seçin *"}
                    </label>
                    <Badge color={selectionCount > 0 ? "blue" : "gray"}>
                      {selectionCount} hedef
                    </Badge>
                  </div>

                  <select
                    multiple
                    className="w-full border rounded p-2 h-36"
                    value={form.targetIds}
                    onChange={(e) => {
                      const vals = Array.from(e.target.selectedOptions).map(
                        (o) => o.value
                      );
                      setForm((f) => ({ ...f, targetIds: vals }));
                      setDirty(true);
                    }}
                  >
                    {currentOptions.map((opt) => (
                      <option key={opt._id} value={opt._id}>
                        {opt.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  label="İndirim Oranı (%) *"
                  value={form.discountRate}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, discountRate: e.target.value }));
                    setDirty(true);
                  }}
                  crossOrigin=""
                />
                <div className="flex items-center h-10 mt-5">
                  <Checkbox
                    checked={form.overrideExisting}
                    onChange={(e) => {
                      setForm((f) => ({
                        ...f,
                        overrideExisting: e.target.checked,
                      }));
                      setDirty(true);
                    }}
                    ripple={false}
                    label="Seçilenlerde mevcut indirimi ez"
                  />
                </div>
              </div>

              {/* Tarihler opsiyonel */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">
                    Başlangıç (opsiyonel)
                  </label>
                  <input
                    type="date"
                    className="w-full border rounded p-2 text-sm"
                    value={form.startAt}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, startAt: e.target.value }));
                      setDirty(true);
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">
                    Bitiş (opsiyonel)
                  </label>
                  <input
                    type="date"
                    className="w-full border rounded p-2 text-sm"
                    value={form.endAt}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, endAt: e.target.value }));
                      setDirty(true);
                    }}
                  />
                </div>
              </div>

              {!isValid && (
                <Typography variant="small" className="text-red-600">
                  Başlık, seçim türü, en az bir hedef ve geçerli indirim oranı
                  gereklidir.
                </Typography>
              )}
            </div>

            {/* SAĞ: ÖNİZLEME */}
            <div>
              <Typography variant="small" className="text-gray-600 mb-2">
                Canlı Önizleme
              </Typography>
              <div className="rounded-xl border overflow-hidden">
                <div className="relative h-40 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-center">
                  <div className="absolute top-2 left-2">
                    <Badge color="amber">
                      {selectionType
                        ? selectionType === "product"
                          ? "Ürün hedefli"
                          : selectionType === "category"
                          ? "Kategori hedefli"
                          : "Alt kategori hedefli"
                        : "Hedef seçilmedi"}
                    </Badge>
                  </div>
                  <div className="text-center px-4">
                    <div className="text-xs text-blue-900/70 mb-1">İndirim</div>
                    <div className="text-2xl font-semibold text-blue-900">
                      %{form.discountRate || 0}
                    </div>
                  </div>
                </div>
                <div className="p-4 space-y-1">
                  <Typography variant="h6" className="line-clamp-1">
                    {form.title || "Kural Başlığı"}
                  </Typography>
                  <div className="text-sm text-gray-700">
                    <b>{selectionCount}</b> hedef seçildi
                  </div>
                  <div className="text-sm text-gray-700">
                    Etkilenecek ürün: <b>{impactedCount}</b>
                  </div>
                  <div className="text-xs text-gray-500">
                    {form.startAt ? fmtDate(form.startAt) : "Başlangıç yok"} →{" "}
                    {form.endAt ? fmtDate(form.endAt) : "Bitiş yok"}
                  </div>
                  <div className="text-xs text-gray-600">
                    {form.overrideExisting
                      ? "Mevcut indirimi ezer."
                      : "Mevcut indirimi korur."}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="text" onClick={closeDialog}>
            İptal
          </Button>
          <Button disabled={!isValid || !dirty} color="blue" onClick={saveRule}>
            Kaydet
          </Button>
        </DialogFooter>
      </Dialog>

      {/* toast */}
      {toast && (
        <div className="z-[2000] fixed bottom-4 right-4">
          <ToastAlert
            msg={toast.msg}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        </div>
      )}
    </div>
  );
}
