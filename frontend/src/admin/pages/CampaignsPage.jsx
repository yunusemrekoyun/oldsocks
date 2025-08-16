// src/pages/admin/CampaignsPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
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
  CheckIcon,
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

/* ───── Küçük yardımcılar ───── */
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
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${map[color]}`}
    >
      {children}
    </span>
  );
};

export default function CampaignsPage() {
  /* ---------------- state ---------------- */
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  /* üst bar filtre/arama/sıralama */
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | active | passive
  const [sortBy, setSortBy] = useState("newest"); // newest | oldest
  const searchRef = useRef(null);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  /* form dialog */
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
    subtitle: "",
    buttonText: "",
    imageUrl: "",
    imageFile: null,
    products: [],
    categories: [],
  });

  /* toast & sil onay */
  const [toast, setToast] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  /* upload queue */
  const { addTask, updateTask, removeTask } = useUploadQueue();

  /* ---------------- data fetch ---------------- */
  useEffect(() => {
    api
      .get("/campaigns")
      .then(({ data }) => setCampaigns(data))
      .catch(() => setToast({ msg: "Kampanyalar alınamadı.", type: "error" }))
      .finally(() => setLoading(false));

    Promise.all([api.get("/products"), api.get("/categories")])
      .then(([{ data: prods }, { data: cats }]) => {
        setOptions({
          products: prods,
          categories: cats,
          subcategories: cats.flatMap((c) => c.children || []),
        });
      })
      .catch(() =>
        setToast({ msg: "Ürün/Kategori verileri alınamadı.", type: "error" })
      );
  }, []);

  /* query debounce */
  useEffect(() => {
    const t = setTimeout(
      () => setDebouncedQuery(query.trim().toLowerCase()),
      250
    );
    return () => clearTimeout(t);
  }, [query]);

  /* ---------------- derived list ---------------- */
  const filtered = useMemo(() => {
    let list = [...campaigns];

    if (debouncedQuery) {
      list = list.filter((c) => {
        const blob = `${c.title} ${c.subtitle} ${c.buttonText}`.toLowerCase();
        return blob.includes(debouncedQuery);
      });
    }

    if (statusFilter === "active") list = list.filter((c) => c.isActive);
    if (statusFilter === "passive") list = list.filter((c) => !c.isActive);

    list.sort((a, b) => {
      const A = a.createdAt || a._id;
      const B = b.createdAt || b._id;
      return sortBy === "newest" ? (A < B ? 1 : -1) : A > B ? 1 : -1;
    });

    return list;
  }, [campaigns, debouncedQuery, statusFilter, sortBy]);

  /* ---------------- dialog helpers ---------------- */
  const resetForm = () => {
    setForm({
      _id: null,
      title: "",
      subtitle: "",
      buttonText: "",
      imageUrl: "",
      imageFile: null,
      products: [],
      categories: [],
    });
    setSelectionType("");
    setDirty(false);
  };

  const openNew = () => {
    resetForm();
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
      subtitle: c.subtitle,
      buttonText: c.buttonText,
      imageUrl: c.imageUrl,
      imageFile: null,
      products: prodIds,
      categories: catIds,
    });
    setSelectionType(type);
    setDirty(false);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (dirty) {
      const sure = confirm("Kaydedilmemiş değişiklikler var. Kapatılsın mı?");
      if (!sure) return;
    }
    setDialogOpen(false);
  };

  /* ---------------- validation ---------------- */
  const selectionCount =
    selectionType === "products"
      ? form.products.length
      : form.categories.length;

  const isValid =
    form.title.trim().length > 0 &&
    selectionType &&
    selectionCount > 0 &&
    (Boolean(form.imageUrl) || Boolean(form.imageFile) || Boolean(form._id));

  /* ---------------- save with queue ---------------- */
  const handleSave = async () => {
    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("subtitle", form.subtitle);
    fd.append("buttonText", form.buttonText);
    if (form.imageFile) fd.append("image", form.imageFile);
    fd.append("products", JSON.stringify(form.products));
    fd.append("categories", JSON.stringify(form.categories));

    const id = uuidv4();
    addTask({ id, name: form.title || "Kampanya", progress: 0 });

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
        await api.put(`/campaigns/${form._id}`, fd, cfg);
      } else {
        await api.post("/campaigns", fd, cfg);
      }

      updateTask(id, { progress: 100, status: "success" });
      setTimeout(() => removeTask(id), 2000);

      const { data } = await api.get("/campaigns");
      setCampaigns(data);
      setDialogOpen(false);
    } catch {
      updateTask(id, {
        progress: 100,
        status: "error",
        errorMsg: "Kampanya kaydedilemedi",
      });
      setTimeout(() => removeTask(id), 4000);
    }
  };

  /* ---------------- delete / activate ---------------- */
  const triggerDelete = (id) => setDeleteId(id);

  const handleDeleteConfirmed = async () => {
    const id = deleteId;
    setDeleteId(null);
    try {
      await api.delete(`/campaigns/${id}`);
      setCampaigns((c) => c.filter((x) => x._id !== id));
      setToast({ msg: "Kampanya silindi.", type: "success" });
    } catch {
      setToast({ msg: "Kampanya silinemedi.", type: "error" });
    }
  };

  const handleActivate = async (id) => {
    try {
      await api.patch(`/campaigns/${id}/activate`);
      const { data } = await api.get("/campaigns");
      setCampaigns(data);
      setToast({ msg: "Kampanya aktif edildi.", type: "success" });
    } catch {
      setToast({ msg: "Aktif etme işlemi başarısız.", type: "error" });
    }
  };

  /* ---------------- helpers ---------------- */
  const currentOptions = options[selectionType] || [];
  const selectedNames = useMemo(() => {
    const mapById = (arr) =>
      arr.reduce((acc, x) => {
        acc[x._id] = x.name;
        return acc;
      }, {});
    const source =
      selectionType === "products"
        ? mapById(options.products)
        : selectionType === "categories"
        ? mapById(options.categories)
        : mapById(options.subcategories);

    const ids = selectionType === "products" ? form.products : form.categories;

    return ids.map((id) => ({ id, name: source[id] || "—" }));
  }, [selectionType, options, form.products, form.categories]);

  /* ---------------- render ---------------- */
  return (
    <div className="space-y-6">
      {/* üst bar */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
        <div className="min-w-0">
          <Typography variant="h4">Kampanyalar</Typography>
          <Typography variant="small" className="text-gray-600">
            Listeden arayın, filtreleyin ve düzenleyin.
          </Typography>
        </div>

        <div className="flex flex-col md:flex-row gap-3 md:items-center w-full md:w-auto">
          {/* search */}
          <div className="relative w-full md:w-72">
            <Input
              inputRef={searchRef}
              icon={<MagnifyingGlassIcon className="h-5 w-5" />}
              label="Ara (başlık, alt başlık)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchRef.current?.blur()}
              crossOrigin=""
            />
          </div>

          {/* status filter */}
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-5 h-5 text-gray-500 hidden md:block" />
            <select
              className="border rounded-lg p-2 text-sm w-full md:w-auto"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Hepsi</option>
              <option value="active">Aktif</option>
              <option value="passive">Pasif</option>
            </select>
          </div>

          {/* sort */}
          <select
            className="border rounded-lg p-2 text-sm w-full md:w-auto"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">En Yeni</option>
            <option value="oldest">En Eski</option>
          </select>

          <Button color="blue" onClick={openNew} className="w-full md:w-auto">
            + Yeni Kampanya
          </Button>
        </div>
      </div>

      {/* liste */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <Typography variant="h6" className="mb-2">
            Kayıt bulunamadı
          </Typography>
          <Typography className="text-gray-600 mb-4">
            Filtreleri temizleyin veya yeni bir kampanya ekleyin.
          </Typography>
          <Button color="blue" onClick={openNew} className="w-full md:w-auto">
            Kampanya Oluştur
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((c) => (
            <Card
              key={c._id}
              className="relative overflow-hidden group border border-gray-100 hover:shadow-xl transition-shadow"
            >
              <div className="relative h-40 sm:h-48">
                <img
                  src={c.imageUrl}
                  alt={c.title}
                  className="w-full h-full object-cover"
                />
                {/* gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/15 to-transparent pointer-events-none" />

                {/* HOVER'DA ORTADA DÜZENLE (desktop) */}
                <button
                  onClick={() => openEdit(c)}
                  className="absolute inset-0 hidden md:flex items-center justify-center bg-white/55 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Düzenle"
                >
                  <span className="inline-flex items-center gap-2 px-3 py-2 bg-white border rounded-lg shadow-sm">
                    <PencilIcon className="w-4 h-4" />
                    Düzenle
                  </span>
                </button>

                <div className="absolute top-2 left-2 flex gap-2">
                  {c.isActive ? (
                    <Badge color="green">Aktif</Badge>
                  ) : (
                    <Badge>Pasif</Badge>
                  )}
                </div>
              </div>

              <CardBody>
                <Typography variant="h6" className="line-clamp-1">
                  {c.title}
                </Typography>
                <Typography className="text-gray-600 line-clamp-2">
                  {c.subtitle}
                </Typography>

                {/* Aksiyonlar */}
                <div className="mt-4 flex items-center justify-end gap-2">
                  {/* Desktop aksiyonları */}
                  <div className="hidden md:flex items-center gap-2">
                    <Tooltip content="Aktif Yap">
                      <Button
                        size="sm"
                        variant="outlined"
                        onClick={() => handleActivate(c._id)}
                        className="px-3"
                        aria-label="Aktif Yap"
                      >
                        <CheckIcon className="w-4 h-4" />
                      </Button>
                    </Tooltip>

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

                  {/* Mobil aksiyonları */}
                  <div className="flex md:hidden w-full gap-2">
                    <button
                      onClick={() => openEdit(c)}
                      className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded border text-xs hover:bg-gray-50"
                      title="Düzenle"
                    >
                      <PencilIcon className="w-4 h-4" />
                      Düzenle
                    </button>
                    <button
                      onClick={() => handleActivate(c._id)}
                      className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded border text-xs hover:bg-gray-50"
                      title="Aktif Yap"
                    >
                      <CheckIcon className="w-4 h-4" />
                      Aktif
                    </button>
                    <button
                      onClick={() => triggerDelete(c._id)}
                      className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded border border-red-200 text-red-600 text-xs hover:bg-red-50"
                      title="Sil"
                    >
                      <TrashIcon className="w-4 h-4" />
                      Sil
                    </button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* form dialog */}
      <Dialog
        open={dialogOpen}
        size="xl"
        handler={closeDialog}
        className="!max-w-[95vw]"
      >
        <DialogHeader>
          {form._id ? "Kampanyayı Güncelle" : "Yeni Kampanya"}
        </DialogHeader>
        <DialogBody divider className="overflow-auto max-h-[70svh] pr-4">
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
              <Input
                label="Alt Başlık"
                value={form.subtitle}
                onChange={(e) => {
                  setForm((f) => ({ ...f, subtitle: e.target.value }));
                  setDirty(true);
                }}
                crossOrigin=""
              />
              <Input
                label="Buton Metni"
                value={form.buttonText}
                onChange={(e) => {
                  setForm((f) => ({ ...f, buttonText: e.target.value }));
                  setDirty(true);
                }}
                crossOrigin=""
              />

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
                  <div className="flex items-center justify-between">
                    <label className="block font-medium">
                      {selectionType === "products"
                        ? "Ürünleri Seçin *"
                        : selectionType === "categories"
                        ? "Kategorileri Seçin *"
                        : "Alt Kategorileri Seçin *"}
                    </label>
                    <Badge color={selectionCount > 0 ? "blue" : "gray"}>
                      {selectionCount} seçili
                    </Badge>
                  </div>

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
                  {selectedNames.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {selectedNames.map((x) => (
                        <span
                          key={x.id}
                          className="px-2 py-1 rounded-full text-xs bg-gray-100"
                        >
                          {x.name}
                        </span>
                      ))}
                    </div>
                  )}
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
                    alt="Mevcut kampanya"
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
                  1920×600 önerilir. JPG/PNG.
                </Typography>
              </div>

              {!isValid && (
                <Typography variant="small" className="text-red-600">
                  Başlık, seçim türü ve en az bir seçim gereklidir.
                </Typography>
              )}
            </div>

            {/* SAĞ: ÖNİZLEME */}
            <div>
              <Typography variant="small" className="text-gray-600 mb-2">
                Canlı Önizleme
              </Typography>
              <div className="rounded-xl border overflow-hidden">
                <div className="relative h-40 sm:h-48">
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
                    <Badge color="amber">
                      {selectionType
                        ? selectionType === "products"
                          ? "Ürün hedefli"
                          : selectionType === "categories"
                          ? "Kategori hedefli"
                          : "Alt kategori hedefli"
                        : "Hedef seçilmedi"}
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <Typography variant="h6" className="line-clamp-1">
                    {form.title || "Kampanya Başlığı"}
                  </Typography>
                  <Typography className="text-gray-600 line-clamp-2">
                    {form.subtitle || "Kısa açıklama metni burada görünecek."}
                  </Typography>
                  <Button size="sm" variant="outlined" className="mt-4">
                    {form.buttonText || "Buton"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogBody>
        <DialogFooter className="gap-2">
          <Button variant="text" onClick={closeDialog}>
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
        message="Bu kampanyayı silmek istediğinize emin misiniz?"
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
