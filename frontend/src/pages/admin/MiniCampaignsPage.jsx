// src/components/pages/MiniCampaignsPage.jsx
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
} from "@heroicons/react/24/outline";
import api from "../../../api";
import ToastAlert from "../../components/ui/ToastAlert";
import { v4 as uuidv4 } from "uuid";
import { useUploadQueue } from "../../context/UploadQueueContext";

/* ───── Silme Onay Modali ───── */
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

  /* ---------------- kaydet (queue) ---------------- */
  const handleSave = async () => {
    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("slot", form.slot);
    if (form.imageFile) fd.append("image", form.imageFile);
    fd.append("products", JSON.stringify(form.products));
    fd.append("categories", JSON.stringify(form.categories));

    /* queue task */
    const id = uuidv4();
    addTask({ id, name: form.title || "Mini Kampanya", progress: 0 });

    const cfg = {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (ev) => {
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
      setDialogOpen(false);
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

  /* ---------------- render helpers ---------------- */
  if (loading) return <div>Yükleniyor…</div>;

  const slot1Taken = items.some((c) => c.slot === 1 && c._id !== form._id);
  const slot2Taken = items.some((c) => c.slot === 2 && c._id !== form._id);
  const currentOptions = options[selectionType] || [];

  /* ---------------- render ---------------- */
  return (
    <div>
      {/* üst bar */}
      <div className="flex justify-between items-center mb-6">
        <Typography variant="h4">Mini Kampanyalar</Typography>
        <Button color="blue" onClick={openNew}>
          + Yeni Mini Kampanya
        </Button>
      </div>

      {/* kartlar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((c) => (
          <Card key={c._id} className="relative">
            <Menu placement="bottom-end">
              <MenuHandler>
                <IconButton variant="text" className="absolute top-2 right-2">
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
              </MenuList>
            </Menu>
            <CardBody>
              <img
                src={c.imageUrl}
                alt={c.title}
                className="mb-4 rounded object-cover w-full h-48"
              />
              <Typography variant="h6">{c.title}</Typography>
              {c.slot === 1 && (
                <span className="inline-block ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                  Slot 1
                </span>
              )}
              {c.slot === 2 && (
                <span className="inline-block ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                  Slot 2
                </span>
              )}
            </CardBody>
          </Card>
        ))}
      </div>

      {/* form dialog */}
      <Dialog open={dialogOpen} size="lg" handler={() => setDialogOpen(false)}>
        <DialogHeader>
          {form._id ? "Mini Kampanyayı Güncelle" : "Yeni Mini Kampanya"}
        </DialogHeader>
        <DialogBody divider className="overflow-auto max-h-[70vh] pr-4">
          <div className="space-y-4">
            {/* başlık */}
            <Input
              label="Başlık"
              value={form.title}
              onChange={(e) => {
                setForm((f) => ({ ...f, title: e.target.value }));
                setDirty(true);
              }}
            />

            {/* slot */}
            <div>
              <label className="block mb-1">Slot</label>
              <select
                className="w-full border rounded p-2"
                value={form.slot}
                onChange={(e) => {
                  setForm((f) => ({ ...f, slot: e.target.value }));
                  setDirty(true);
                }}
              >
                <option value="">-- Seçiniz --</option>
                <option value="1" disabled={slot1Taken}>
                  Slot 1 {slot1Taken && "(Dolu)"}
                </option>
                <option value="2" disabled={slot2Taken}>
                  Slot 2 {slot2Taken && "(Dolu)"}
                </option>
              </select>
            </div>

            {/* seçim türü */}
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
                <option value="">-- Seçin --</option>
                <option value="products">Ürün</option>
                <option value="categories">Kategori</option>
                <option value="subcategories">Alt Kategori</option>
              </select>
            </div>

            {/* çoklu seçim */}
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

            {/* mevcut resim */}
            {form._id && form.imageUrl && !form.imageFile && (
              <div>
                <Typography variant="small" className="mb-1 text-gray-500">
                  Mevcut Resim
                </Typography>
                <img
                  src={form.imageUrl}
                  alt="Mevcut"
                  className="w-32 h-32 object-cover rounded mb-2"
                />
              </div>
            )}

            {/* resim yükle */}
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
