// src/components/pages/MiniCampaignsPage.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
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
} from "@material-tailwind/react";
import {
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowUpTrayIcon,
} from "@heroicons/react/24/outline";
import api from "../../../api";
import ToastAlert from "../../components/ui/ToastAlert";
import { v4 as uuidv4 } from "uuid";
import { useUploadQueue } from "../../context/UploadQueueContext";

/* ───── Silme Onayı ───── */
const ConfirmModal = ({ open, onClose, onConfirm, message }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-xl p-6 shadow max-w-sm w-full">
        <Typography className="mb-6">{message}</Typography>
        <div className="flex justify-end gap-3">
          <Button variant="text" onClick={onClose}>
            Vazgeç
          </Button>
          <Button color="red" onClick={onConfirm}>
            Sil
          </Button>
        </div>
      </div>
    </div>
  );
};

/* ───── Skeleton Card ───── */
const CardSkeleton = () => (
  <div className="animate-pulse rounded-xl border border-gray-100 overflow-hidden">
    <div className="h-48 bg-gray-200" />
    <div className="p-4 space-y-2">
      <div className="h-4 bg-gray-200 rounded w-2/3" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
      <div className="h-8 bg-gray-200 rounded w-24 mt-3" />
    </div>
  </div>
);

const Badge = ({ children, color = "gray" }) => {
  const map = {
    blue: "bg-blue-100 text-blue-800",
    green: "bg-green-100 text-green-800",
    gray: "bg-gray-100 text-gray-700",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${map[color]}`}
    >
      {children}
    </span>
  );
};

export default function MiniCampaignsPage() {
  /* ---------------- state ---------------- */
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dirty, setDirty] = useState(false);

  const [selectionType, setSelectionType] = useState("");
  const [options, setOptions] = useState({
    products: [],
    categories: [],
    subcategories: [],
  });

  const [form, setForm] = useState({
    _id: null,
    title: "",
    imageUrl: "",
    imageFile: null,
    products: [],
    categories: [],
    slot: "",
  });

  /* üst bar: arama + slot filtresi */
  const [query, setQuery] = useState("");
  const [slotFilter, setSlotFilter] = useState("all"); // all | 1 | 2
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const searchRef = useRef(null);

  /* toast & sil onay */
  const [toast, setToast] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  /* upload queue */
  const { addTask, updateTask, removeTask } = useUploadQueue();

  /* ---------------- verileri yükle ---------------- */
  useEffect(() => {
    Promise.all([
      api.get("/mini-campaigns"),
      api.get("/products"),
      api.get("/categories"),
    ])
      .then(([{ data: mc }, { data: prods }, { data: cats }]) => {
        setItems(mc);
        setOptions({
          products: prods,
          categories: cats,
          subcategories: cats.flatMap((c) => c.children || []),
        });
      })
      .catch(() =>
        setToast({
          msg: "Veriler alınamadı, lütfen tekrar deneyin.",
          type: "error",
        })
      )
      .finally(() => setLoading(false));
  }, []);

  /* debounce arama */
  useEffect(() => {
    const t = setTimeout(
      () => setDebouncedQuery(query.trim().toLowerCase()),
      250
    );
    return () => clearTimeout(t);
  }, [query]);

  /* ---------------- dialog helpers ---------------- */
  const openNew = () => {
    setForm({
      _id: null,
      title: "",
      imageUrl: "",
      imageFile: null,
      products: [],
      categories: [],
      slot: "",
    });
    setSelectionType("");
    setDirty(false);
    setDialogOpen(true);
  };

  const openEdit = (c) => {
    const prodIds = c.products.map((p) => p._id);
    const catIds = c.categories.map((cat) => cat._id);
    const subIds = options.subcategories.map((s) => s._id);

    let type = "";
    if (prodIds.length) type = "products";
    else if (catIds.some((id) => subIds.includes(id))) type = "subcategories";
    else if (catIds.length) type = "categories";

    setForm({
      _id: c._id,
      title: c.title,
      imageUrl: c.imageUrl,
      imageFile: null,
      products: prodIds,
      categories: catIds,
      slot: c.slot ? String(c.slot) : "",
    });
    setSelectionType(type);
    setDirty(false);
    setDialogOpen(true);
  };

  /* ---------------- kaydet (queue) ----------------
     Not: Kaydet’e basınca form ANINDA kapanır (task list altta ilerler) */
  const handleSave = async () => {
    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("slot", form.slot);
    if (form.imageFile) fd.append("image", form.imageFile);
    fd.append("products", JSON.stringify(form.products));
    fd.append("categories", JSON.stringify(form.categories));

    const id = uuidv4();
    addTask({ id, name: form.title || "Mini Kampanya", progress: 0 });

    // formu hemen kapat
    setDialogOpen(false);

    const cfg = {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (ev) => {
        if (!ev.total) return;
        const pct = Math.round((ev.loaded * 100) / ev.total);
        updateTask(id, { progress: pct });
      },
    };

    try {
      if (form._id) {
        await api.put(`/mini-campaigns/${form._id}`, fd, cfg);
      } else {
        await api.post("/mini-campaigns", fd, cfg);
      }

      updateTask(id, { progress: 100, status: "success" });
      setTimeout(() => removeTask(id), 2000);

      const { data } = await api.get("/mini-campaigns");
      setItems(data);
    } catch (err) {
      console.error("Kampanya kaydetme hatası:", err);
      updateTask(id, {
        progress: 100,
        status: "error",
        errorMsg: "Mini kampanya kaydedilemedi",
      });
      setTimeout(() => removeTask(id), 4000);
    }
  };

  /* ---------------- silme ---------------- */
  const triggerDelete = (id) => setDeleteId(id);

  const handleDeleteConfirmed = async () => {
    const id = deleteId;
    setDeleteId(null);
    try {
      await api.delete(`/mini-campaigns/${id}`);
      setItems((xs) => xs.filter((x) => x._id !== id));
      setToast({ msg: "Mini kampanya silindi.", type: "success" });
    } catch {
      setToast({ msg: "Mini kampanya silinemedi.", type: "error" });
    }
  };

  /* ---------------- derived list ---------------- */
  const filtered = useMemo(() => {
    let list = [...items];

    if (debouncedQuery) {
      list = list.filter((c) =>
        (c.title || "").toLowerCase().includes(debouncedQuery)
      );
    }

    if (slotFilter !== "all") {
      const slotNum = Number(slotFilter);
      list = list.filter((c) => Number(c.slot) === slotNum);
    }

    // en yeni üstte (createdAt varsa), yoksa _id fallback
    list.sort((a, b) => {
      const A = a.createdAt || a._id;
      const B = b.createdAt || b._id;
      return A < B ? 1 : -1;
    });

    return list;
  }, [items, debouncedQuery, slotFilter]);

  /* ---------------- render helpers ---------------- */
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Typography variant="h4">Mini Kampanyalar</Typography>
          <Button color="blue" disabled>
            + Yeni Mini Kampanya
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  const slot1Taken = items.some(
    (c) => Number(c.slot) === 1 && c._id !== form._id
  );
  const slot2Taken = items.some(
    (c) => Number(c.slot) === 2 && c._id !== form._id
  );
  const currentOptions = options[selectionType] || [];

  const selectionCount =
    selectionType === "products"
      ? form.products.length
      : form.categories.length;

  const isValid =
    (form.title || "").trim().length > 0 &&
    form.slot &&
    selectionType &&
    selectionCount > 0 &&
    (Boolean(form.imageUrl) || Boolean(form.imageFile) || Boolean(form._id));

  return (
    <div className="space-y-6">
      {/* üst bar */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
        <div>
          <Typography variant="h4">Mini Kampanyalar</Typography>
          <Typography variant="small" className="text-gray-600">
            Başlığa göre arayın, slot’a göre filtreleyin.
          </Typography>
        </div>

        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <div className="relative">
            <Input
              inputRef={searchRef}
              icon={<MagnifyingGlassIcon className="h-5 w-5" />}
              label="Ara (başlık)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              crossOrigin=""
            />
          </div>

          <div className="flex items-center gap-2">
            <FunnelIcon className="w-5 h-5 text-gray-500" />
            <select
              className="border rounded-lg p-2 text-sm"
              value={slotFilter}
              onChange={(e) => setSlotFilter(e.target.value)}
            >
              <option value="all">Tüm Slotlar</option>
              <option value="1">Slot 1</option>
              <option value="2">Slot 2</option>
            </select>
          </div>

          <Button color="blue" onClick={openNew}>
            + Yeni Mini Kampanya
          </Button>
        </div>
      </div>

      {/* liste */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <Typography variant="h6" className="mb-2">
            Kayıt bulunamadı
          </Typography>
          <Typography className="text-gray-600 mb-4">
            Filtreleri temizleyin veya yeni bir mini kampanya ekleyin.
          </Typography>
          <Button color="blue" onClick={openNew}>
            Mini Kampanya Oluştur
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <Card
              key={c._id}
              className="relative overflow-hidden group border border-gray-100 hover:shadow-xl transition-shadow"
            >
              <div className="relative h-48">
                <img
                  src={c.imageUrl}
                  alt={c.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/15 to-transparent pointer-events-none" />

                {/* HOVER'DA ORTADA DÜZENLE */}
                <button
                  onClick={() => openEdit(c)}
                  className="absolute inset-0 hidden group-hover:flex items-center justify-center bg-white/55 backdrop-blur-sm transition"
                  title="Düzenle"
                >
                  <span className="inline-flex items-center gap-2 px-3 py-2 bg-white border rounded-lg shadow-sm">
                    <PencilIcon className="w-4 h-4" />
                    Düzenle
                  </span>
                </button>

                <div className="absolute top-2 left-2 flex gap-2">
                  {Number(c.slot) === 1 && <Badge color="blue">Slot 1</Badge>}
                  {Number(c.slot) === 2 && <Badge color="green">Slot 2</Badge>}
                </div>
              </div>
              <CardBody>
                <Typography variant="h6" className="line-clamp-1">
                  {c.title}
                </Typography>

                                {/* aksiyon çubuğu: yalnızca sağ tarafta (hover overlay ile düzenleme kalır) */}
                <div className="mt-4 flex items-center justify-end gap-2">
                  <div className="flex items-center gap-2">
                    <Tooltip content="Sil">
                      <Button
                        size="sm"
                        color="red"
                        variant="outlined"
                        onClick={() => triggerDelete(c._id)}
                        className="px-3"
                        aria-label="Sil"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </Tooltip>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* form dialog */}
      <Dialog open={dialogOpen} size="xl" handler={() => setDialogOpen(false)}>
        <DialogHeader>
          {form._id ? "Mini Kampanyayı Güncelle" : "Yeni Mini Kampanya"}
        </DialogHeader>
        <DialogBody divider className="overflow-auto max-h-[75vh] pr-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SOL: FORM */}
            <div className="space-y-4">
              {/* başlık */}
              <Input
                label="Başlık *"
                value={form.title}
                onChange={(e) => {
                  setForm((f) => ({ ...f, title: e.target.value }));
                  setDirty(true);
                }}
                crossOrigin=""
              />

              {/* slot */}
              <div>
                <label className="block mb-2 font-medium">Slot *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setForm((f) => ({ ...f, slot: "1" }));
                      setDirty(true);
                    }}
                    disabled={slot1Taken && form._id == null}
                    className={`border rounded-lg py-2 text-sm ${
                      form.slot === "1"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:bg-gray-50"
                    } ${
                      slot1Taken && form._id == null
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    Slot 1 {slot1Taken && form._id == null ? "(Dolu)" : ""}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setForm((f) => ({ ...f, slot: "2" }));
                      setDirty(true);
                    }}
                    disabled={slot2Taken && form._id == null}
                    className={`border rounded-lg py-2 text-sm ${
                      form.slot === "2"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:bg-gray-50"
                    } ${
                      slot2Taken && form._id == null
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    Slot 2 {slot2Taken && form._id == null ? "(Dolu)" : ""}
                  </button>
                </div>
              </div>

              {/* seçim türü */}
              <div>
                <label className="block mb-2 font-medium">Seçim Türü *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "", label: "—" },
                    { key: "products", label: "Ürün" },
                    { key: "categories", label: "Kategori" },
                    { key: "subcategories", label: "Alt Kategori" },
                  ].map((t) => (
                    <button
                      key={t.key || "none"}
                      type="button"
                      onClick={() => {
                        setSelectionType(t.key);
                        setForm((f) => ({
                          ...f,
                          products: [],
                          categories: [],
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

              {/* çoklu seçim */}
              {selectionType && (
                <div className="space-y-2">
                  <label className="block font-medium">
                    {selectionType === "products"
                      ? "Ürünleri Seçin *"
                      : selectionType === "categories"
                      ? "Kategorileri Seçin *"
                      : "Alt Kategorileri Seçin *"}
                  </label>

                  <select
                    multiple
                    className="w-full border rounded p-2 h-36"
                    value={
                      selectionType === "products"
                        ? form.products
                        : form.categories
                    }
                    onChange={(e) => {
                      const vals = Array.from(e.target.selectedOptions).map(
                        (o) => o.value
                      );
                      setForm((f) => ({
                        ...f,
                        products:
                          selectionType === "products" ? vals : f.products,
                        categories:
                          selectionType !== "products" ? vals : f.categories,
                      }));
                      setDirty(true);
                    }}
                  >
                    {currentOptions.map((opt) => (
                      <option key={opt._id} value={opt._id}>
                        {opt.name}
                      </option>
                    ))}
                  </select>

                  {/* seçili chip'ler */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {(selectionType === "products"
                      ? form.products
                      : form.categories
                    ).map((id) => {
                      const src =
                        selectionType === "products"
                          ? options.products
                          : selectionType === "categories"
                          ? options.categories
                          : options.subcategories;
                      const item = src.find((x) => x._id === id);
                      return (
                        <span
                          key={id}
                          className="px-2 py-1 rounded-full text-xs bg-gray-100"
                        >
                          {item?.name || "—"}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* mevcut resim */}
              {form._id && form.imageUrl && !form.imageFile && (
                <div>
                  <Typography
                    variant="small"
                    className="block mb-1 text-gray-500"
                  >
                    Mevcut Resim
                  </Typography>
                  <img
                    src={form.imageUrl}
                    alt="Mevcut"
                    className="w-32 h-32 object-cover rounded mb-2 border"
                  />
                </div>
              )}

              {/* resim yükle */}
              <div>
                <label className="block text-sm mb-2 font-medium">
                  Kapak Görseli
                </label>
                <label
                  className="border-2 border-dashed rounded-xl p-4 flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-50"
                  title="Görsel yükle"
                >
                  <ArrowUpTrayIcon className="w-5 h-5" />
                  <span className="text-sm">
                    {form.imageFile ? form.imageFile.name : "Dosya seçin"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setForm((f) => ({
                        ...f,
                        imageFile: file,
                        imageUrl: URL.createObjectURL(file),
                      }));
                      setDirty(true);
                    }}
                  />
                </label>
                <Typography variant="small" className="text-gray-500 mt-1">
                  1200×600 önerilir. JPG/PNG.
                </Typography>
              </div>

              {/* uyarı */}
              {!isValid && (
                <Typography variant="small" className="text-red-600">
                  Başlık, slot, seçim türü ve en az bir seçim gereklidir.
                </Typography>
              )}
            </div>

            {/* SAĞ: ÖNİZLEME */}
            <div>
              <Typography variant="small" className="text-gray-600 mb-2">
                Canlı Önizleme
              </Typography>
              <div className="rounded-xl border overflow-hidden">
                <div className="relative h-48">
                  {form.imageUrl ? (
                    <img
                      src={form.imageUrl}
                      alt="Önizleme"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                      Görsel seçilmedi
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/15 to-transparent" />
                  <div className="absolute top-2 left-2">
                    {form.slot === "1" && <Badge color="blue">Slot 1</Badge>}
                    {form.slot === "2" && <Badge color="green">Slot 2</Badge>}
                  </div>
                </div>
                <div className="p-4">
                  <Typography variant="h6" className="line-clamp-1">
                    {form.title || "Mini Kampanya Başlığı"}
                  </Typography>
                </div>
              </div>
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="text" onClick={() => setDialogOpen(false)}>
            İptal
          </Button>
          <Button
            disabled={!isValid || !dirty}
            onClick={handleSave}
            color="blue"
          >
            Kaydet
          </Button>
        </DialogFooter>
      </Dialog>

      {/* silme onayı */}
      <ConfirmModal
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirmed}
        message="Bu mini kampanyayı silmek istediğinize emin misiniz?"
      />

      {/* toast */}
      {toast && (
        <ToastAlert
          msg={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
