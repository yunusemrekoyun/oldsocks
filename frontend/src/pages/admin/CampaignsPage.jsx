// src/pages/admin/CampaignsPage.jsx
import React, { useEffect, useState } from "react";
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
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
  IconButton,
} from "@material-tailwind/react";
import {
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import api from "../../../api";
import ToastAlert from "../../components/ui/ToastAlert"; // ← yolu kontrol edin

/* ────────── Basit Silme Onay Modali ────────── */
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

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

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
  const [toast, setToast] = useState(null); // { msg, type }
  const [deleteId, setDeleteId] = useState(null);

  /* ────────── Verileri yükle ────────── */
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

  /* ────────── Yeni / Düzenle ────────── */
  const openNew = () => {
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
    setDialogOpen(true);
  };

  const openEdit = (c) => {
    const prodIds = c.products.map((p) => p._id);
    const catIds = c.categories.map((cat) => cat._id);
    const subIds = options.subcategories.map((sub) => sub._id);

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

  /* ────────── Kaydet ────────── */
  const handleSave = async () => {
    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("subtitle", form.subtitle);
    fd.append("buttonText", form.buttonText);
    if (form.imageFile) fd.append("image", form.imageFile);
    fd.append("products", JSON.stringify(form.products));
    fd.append("categories", JSON.stringify(form.categories));

    try {
      if (form._id) {
        await api.put(`/campaigns/${form._id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setToast({ msg: "Kampanya güncellendi.", type: "success" });
      } else {
        await api.post("/campaigns", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setToast({ msg: "Kampanya oluşturuldu.", type: "success" });
      }
      const { data } = await api.get("/campaigns");
      setCampaigns(data);
      setDialogOpen(false);
    } catch {
      setToast({ msg: "Kaydetme sırasında hata oluştu.", type: "error" });
    }
  };

  /* ────────── Silme akışı ────────── */
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

  /* ────────── Aktif et ────────── */
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

  /* ────────── Render ────────── */
  if (loading) return <div>Yükleniyor…</div>;

  const currentOptions = options[selectionType] || [];

  return (
    <div>
      {/* Üst bar */}
      <div className="flex justify-between items-center mb-6">
        <Typography variant="h4">Kampanyalar</Typography>
        <Button color="blue" onClick={openNew}>
          + Yeni Kampanya
        </Button>
      </div>

      {/* Kartlar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {campaigns.map((c) => (
          <Card key={c._id} className="relative">
            <Menu placement="bottom-end">
              <MenuHandler>
                <IconButton
                  variant="text"
                  className="absolute top-2 right-2"
                  ripple={false}
                >
                  <EllipsisVerticalIcon className="w-5 h-5" />
                </IconButton>
              </MenuHandler>
              <MenuList>
                <MenuItem onClick={() => openEdit(c)}>
                  <PencilIcon className="w-4 h-4 mr-2" /> Güncelle
                </MenuItem>
                <MenuItem onClick={() => triggerDelete(c._id)}>
                  <TrashIcon className="w-4 h-4 mr-2" /> Sil
                </MenuItem>
                <MenuItem onClick={() => handleActivate(c._id)}>
                  <CheckIcon className="w-4 h-4 mr-2" /> Aktif Yap
                </MenuItem>
              </MenuList>
            </Menu>
            <CardBody>
              <img
                src={c.imageUrl}
                alt={c.title}
                className="mb-4 rounded object-cover w-full h-48"
              />
              <Typography variant="h6">{c.title}</Typography>
              <Typography className="text-gray-600">{c.subtitle}</Typography>
              <Button size="sm" variant="outlined" className="mt-4">
                {c.buttonText}
              </Button>
              {c.isActive && (
                <span className="inline-block ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                  Aktif
                </span>
              )}
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Form dialog */}
      <Dialog open={dialogOpen} size="lg" handler={() => setDialogOpen(false)}>
        <DialogHeader>
          {form._id ? "Kampanyayı Güncelle" : "Yeni Kampanya"}
        </DialogHeader>
        <DialogBody divider className="overflow-auto max-h-[70vh] pr-4">
          <div className="space-y-4">
            {/* Başlık */}
            <Input
              label="Başlık"
              value={form.title}
              onChange={(e) => {
                setForm((f) => ({ ...f, title: e.target.value }));
                setDirty(true);
              }}
            />
            {/* Alt Başlık */}
            <Input
              label="Alt Başlık"
              value={form.subtitle}
              onChange={(e) => {
                setForm((f) => ({ ...f, subtitle: e.target.value }));
                setDirty(true);
              }}
            />
            {/* Buton Metni */}
            <Input
              label="Buton Metni"
              value={form.buttonText}
              onChange={(e) => {
                setForm((f) => ({ ...f, buttonText: e.target.value }));
                setDirty(true);
              }}
            />

            {/* Seçim Türü */}
            <div>
              <label className="block mb-1">Seçim Türü</label>
              <select
                className="w-full border rounded p-2"
                value={selectionType}
                onChange={(e) => {
                  setSelectionType(e.target.value);
                  setForm((f) => ({ ...f, products: [], categories: [] }));
                  setDirty(true);
                }}
              >
                <option value="">-- Seçiniz --</option>
                <option value="products">Ürün</option>
                <option value="categories">Kategori</option>
                <option value="subcategories">Alt Kategori</option>
              </select>
            </div>

            {/* Çoklu seçim */}
            {selectionType && (
              <div>
                <label className="block mb-1">
                  {selectionType === "products"
                    ? "Ürünleri Seçin"
                    : selectionType === "categories"
                    ? "Kategorileri Seçin"
                    : "Alt Kategorileri Seçin"}
                </label>
                <select
                  multiple
                  className="w-full border rounded p-2 h-32"
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
              </div>
            )}

            {/* Mevcut resim */}
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
                  className="w-32 h-32 object-cover rounded mb-2"
                />
              </div>
            )}

            {/* Resim yükle */}
            <div>
              <label className="block text-sm mb-1">Resim Yükle</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  setForm((f) => ({
                    ...f,
                    imageFile: file,
                    imageUrl: URL.createObjectURL(file),
                  }));
                  setDirty(true);
                }}
              />
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="text" onClick={() => setDialogOpen(false)}>
            İptal
          </Button>
          <Button disabled={!dirty} onClick={handleSave} color="blue">
            Kaydet
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Silme onayı */}
      <ConfirmModal
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirmed}
        message="Bu kampanyayı silmek istediğinize emin misiniz?"
      />

      {/* Toast */}
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
