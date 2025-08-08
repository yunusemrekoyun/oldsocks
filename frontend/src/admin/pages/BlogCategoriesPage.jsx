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

export default function BlogCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  /* form dialog */
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [form, setForm] = useState({
    _id: null,
    name: "",
    slug: "",
    description: "",
  });

  /* toast + sil onay */
  const [toast, setToast] = useState(null); // { msg, type }
  const [deleteId, setDeleteId] = useState(null); // silinecek kategori id

  /* ────────── Verileri yükle ────────── */
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/blog-categories");
      setCategories(data);
    } catch (err) {
      console.error("Kategoriler alınamadı:", err);
      setToast({ msg: "Kategoriler alınamadı.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  /* ────────── Yeni / düzenle ────────── */
  const openNew = () => {
    setForm({ _id: null, name: "", slug: "", description: "" });
    setDirty(false);
    setDialogOpen(true);
  };

  const openEdit = (cat) => {
    setForm({
      _id: cat._id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
    });
    setDirty(false);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (form._id) {
        await api.put(`/blog-categories/${form._id}`, {
          name: form.name,
          slug: form.slug,
          description: form.description,
        });
        setToast({ msg: "Kategori güncellendi.", type: "success" });
      } else {
        await api.post("/blog-categories", {
          name: form.name,
          slug: form.slug,
          description: form.description,
        });
        setToast({ msg: "Kategori oluşturuldu.", type: "success" });
      }
      await fetchCategories();
      setDialogOpen(false);
    } catch (err) {
      console.error("Kaydetme hatası:", err);
      setToast({ msg: "Kategori kaydedilemedi.", type: "error" });
    }
  };

  /* ────────── Silme akışı ────────── */
  const triggerDelete = (id) => setDeleteId(id);

  const handleDeleteConfirmed = async () => {
    const id = deleteId;
    setDeleteId(null);
    try {
      await api.delete(`/blog-categories/${id}`);
      setCategories((cats) => cats.filter((c) => c._id !== id));
      setToast({ msg: "Kategori silindi.", type: "success" });
    } catch (err) {
      console.error("Silme hatası:", err);
      setToast({ msg: "Kategori silinemedi.", type: "error" });
    }
  };

  /* ────────── Render ────────── */
  if (loading) return <div>Yükleniyor…</div>;

  return (
    <div>
      {/* Üst bar */}
      <div className="flex justify-between items-center mb-6">
        <Typography variant="h4">Blog Kategorileri</Typography>
        <Button color="blue" onClick={openNew}>
          + Yeni Kategori
        </Button>
      </div>

      {/* Kartlar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <Card key={cat._id} className="relative">
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
                <MenuItem onClick={() => openEdit(cat)}>
                  <PencilIcon className="w-4 h-4 mr-2" /> Güncelle
                </MenuItem>
                <MenuItem onClick={() => triggerDelete(cat._id)}>
                  <TrashIcon className="w-4 h-4 mr-2" /> Sil
                </MenuItem>
              </MenuList>
            </Menu>
            <CardBody>
              <Typography variant="h6" className="mb-2">
                {cat.name}
              </Typography>
              <Typography className="text-gray-600 text-sm">
                {cat.slug}
              </Typography>
              {cat.description && (
                <Typography className="text-gray-500 text-xs mt-1">
                  {cat.description}
                </Typography>
              )}
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Form dialog */}
      <Dialog open={dialogOpen} size="md" handler={() => setDialogOpen(false)}>
        <DialogHeader>
          {form._id ? "Kategori Güncelle" : "Yeni Kategori"}
        </DialogHeader>
        <DialogBody divider className="space-y-4">
          <Input
            label="Ad"
            value={form.name}
            onChange={(e) => {
              setForm((f) => ({ ...f, name: e.target.value }));
              setDirty(true);
            }}
          />
          <Input
            label="Slug"
            value={form.slug}
            onChange={(e) => {
              setForm((f) => ({ ...f, slug: e.target.value }));
              setDirty(true);
            }}
          />
          <Input
            label="Açıklama"
            value={form.description}
            onChange={(e) => {
              setForm((f) => ({ ...f, description: e.target.value }));
              setDirty(true);
            }}
          />
        </DialogBody>
        <DialogFooter>
          <Button
            variant="text"
            onClick={() => setDialogOpen(false)}
            className="mr-2"
          >
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
        message="Bu kategoriyi silmek istediğinize emin misiniz?"
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
