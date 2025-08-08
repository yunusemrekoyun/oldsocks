// src/pages/admin/BlogsPage.jsx
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
  Textarea,
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

export default function BlogsPage() {
  /* ---------------- state ---------------- */
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [form, setForm] = useState({
    _id: null,
    title: "",
    subtitle: "",
    excerpt: "",
    content: "",
    categories: [],
    author: "",
    tagsArray: [],
    coverImage: null,
    coverPreview: null,
  });
  const [tagInput, setTagInput] = useState("");

  const [toast, setToast] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  /* upload queue */
  const { addTask, updateTask, removeTask } = useUploadQueue();

  /* ---------------- veri çek ---------------- */
  useEffect(() => {
    Promise.all([
      api.get("/blogs"),
      api.get("/blog-categories"),
      api.get("/users"),
    ])
      .then(([{ data: bs }, { data: cats }, { data: users }]) => {
        setBlogs(bs);
        setCategories(cats);
        setAdmins(users.filter((u) => u.role === "admin"));
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
      subtitle: "",
      excerpt: "",
      content: "",
      categories: [],
      author: "",
      tagsArray: [],
      coverImage: null,
      coverPreview: null,
    });
    setTagInput("");
    setDirty(false);
    setDialogOpen(true);
  };

  const openEdit = async (b) => {
    try {
      const { data } = await api.get(`/blogs/${b._id}`);
      setForm({
        _id: data._id,
        title: data.title,
        subtitle: data.subtitle,
        excerpt: data.excerpt,
        content: data.content,
        categories: data.categories.map((c) => c._id),
        author: data.author._id,
        tagsArray: data.tags || [],
        coverImage: null,
        coverPreview: data.coverImageUrl,
      });
      setTagInput("");
      setDirty(false);
      setDialogOpen(true);
    } catch {
      setToast({ msg: "Blog verisi alınamadı.", type: "error" });
    }
  };

  /* ---------------- tag işlemleri ---------------- */
  const handleTagKeyDown = (e) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!form.tagsArray.includes(tagInput.trim())) {
        setForm((f) => ({
          ...f,
          tagsArray: [...f.tagsArray, tagInput.trim()],
        }));
        setDirty(true);
      }
      setTagInput("");
    }
  };
  const removeTag = (tag) => {
    setForm((f) => ({
      ...f,
      tagsArray: f.tagsArray.filter((t) => t !== tag),
    }));
    setDirty(true);
  };

  /* ---------------- kaydet (queue) ---------------- */
  const handleSave = async () => {
    if (!form.categories.length) {
      setToast({ msg: "En az bir kategori seçin.", type: "error" });
      return;
    }
    if (!form.author) {
      setToast({ msg: "Lütfen bir yazar seçin.", type: "error" });
      return;
    }

    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("subtitle", form.subtitle);
    fd.append("excerpt", form.excerpt);
    fd.append("content", form.content);
    fd.append("categories", JSON.stringify(form.categories));
    fd.append("author", form.author);
    fd.append("tags", JSON.stringify(form.tagsArray));
    if (form.coverImage) fd.append("coverImage", form.coverImage);

    /* queue task */
    const id = uuidv4();
    addTask({ id, name: form.title || "Blog", progress: 0 });

    const cfg = {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (ev) => {
        const pct = Math.round((ev.loaded * 100) / ev.total);
        updateTask(id, { progress: pct });
      },
    };

    try {
      if (form._id) {
        await api.put(`/blogs/${form._id}`, fd, cfg);
      } else {
        await api.post("/blogs", fd, cfg);
      }

      updateTask(id, { progress: 100, status: "success" });
      setTimeout(() => removeTask(id), 2000);

      const { data } = await api.get("/blogs");
      setBlogs(data);
      setDialogOpen(false);
    } catch {
      updateTask(id, {
        progress: 100,
        status: "error",
        errorMsg: "Blog kaydedilemedi",
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
      await api.delete(`/blogs/${id}`);
      setBlogs((bs) => bs.filter((b) => b._id !== id));
      setToast({ msg: "Blog silindi.", type: "success" });
    } catch {
      setToast({ msg: "Blog silinemedi.", type: "error" });
    }
  };

  /* ---------------- render helpers ---------------- */
  if (loading) return <div>Yükleniyor…</div>;

  const canSave =
    dirty &&
    form.categories.length > 0 &&
    form.author &&
    form.title.trim() !== "" &&
    form.content.trim() !== "";

  /* ---------------- render ---------------- */
  return (
    <div>
      {/* üst bar */}
      <div className="flex justify-between items-center mb-6">
        <Typography variant="h4">Bloglar</Typography>
        <Button color="blue" onClick={openNew}>
          + Yeni Blog
        </Button>
      </div>

      {/* kartlar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {blogs.map((b) => (
          <Card key={b._id} className="relative">
            <Menu placement="bottom-end">
              <MenuHandler>
                <IconButton variant="text" className="absolute top-2 right-2">
                  <EllipsisVerticalIcon className="w-5 h-5" />
                </IconButton>
              </MenuHandler>
              <MenuList>
                <MenuItem onClick={() => openEdit(b)}>
                  <PencilIcon className="w-4 h-4 mr-2" /> Güncelle
                </MenuItem>
                <MenuItem onClick={() => triggerDelete(b._id)}>
                  <TrashIcon className="w-4 h-4 mr-2" /> Sil
                </MenuItem>
              </MenuList>
            </Menu>
            <CardBody>
              {b.coverImageUrl && (
                <img
                  src={b.coverImageUrl}
                  alt={b.title}
                  className="mb-4 rounded object-cover w-full h-48"
                />
              )}
              <Typography variant="h6">{b.title}</Typography>
              <Typography className="text-gray-600 text-sm">
                {b.excerpt}
              </Typography>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* form dialog */}
      <Dialog open={dialogOpen} size="lg" handler={() => setDialogOpen(false)}>
        <DialogHeader>{form._id ? "Blogu Güncelle" : "Yeni Blog"}</DialogHeader>
        <DialogBody divider className="space-y-4 max-h-[70vh] overflow-y-auto">
          {/* başlık */}
          <Input
            label="Başlık"
            value={form.title}
            onChange={(e) => {
              setForm((f) => ({ ...f, title: e.target.value }));
              setDirty(true);
            }}
          />
          {/* alt başlık */}
          <Input
            label="Alt Başlık"
            value={form.subtitle}
            onChange={(e) => {
              setForm((f) => ({ ...f, subtitle: e.target.value }));
              setDirty(true);
            }}
          />
          {/* kısa açıklama */}
          <Input
            label="Kısa Açıklama"
            value={form.excerpt}
            onChange={(e) => {
              setForm((f) => ({ ...f, excerpt: e.target.value }));
              setDirty(true);
            }}
          />

          {/* içerik */}
          <Textarea
            label="İçerik"
            value={form.content}
            onChange={(e) => {
              setForm((f) => ({ ...f, content: e.target.value }));
              setDirty(true);
            }}
            className="h-40"
          />

          {/* kategoriler */}
          <div>
            <label className="block mb-1 text-sm">Kategoriler</label>
            <select
              multiple
              className="w-full border rounded p-2 h-32"
              value={form.categories}
              onChange={(e) => {
                const vals = Array.from(e.target.selectedOptions).map(
                  (o) => o.value
                );
                setForm((f) => ({ ...f, categories: vals }));
                setDirty(true);
              }}
            >
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* yazar */}
          <div>
            <label className="block mb-1 text-sm">Yazar</label>
            <select
              className="w-full border rounded p-2"
              value={form.author}
              onChange={(e) => {
                setForm((f) => ({ ...f, author: e.target.value }));
                setDirty(true);
              }}
            >
              <option value="">-- Yazar Seçiniz --</option>
              {admins.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.firstName} {u.lastName}
                </option>
              ))}
            </select>
          </div>

          {/* tags */}
          <div>
            <label className="block mb-1 text-sm">Tags</label>
            <div className="flex flex-wrap gap-2 border rounded p-2">
              {form.tagsArray.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center bg-blue-100 text-blue-800 rounded-full px-2 py-1 text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 text-xs font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Yeni tag eklemek için Enter"
                className="flex-1 min-w-[8rem] outline-none"
              />
            </div>
          </div>

          {/* kapak resmi */}
          <div>
            <Typography variant="small" className="block mb-1">
              Kapak Resmi
            </Typography>
            {form.coverPreview && (
              <img
                src={form.coverPreview}
                alt="Preview"
                className="w-32 h-32 object-cover rounded mb-2"
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                setForm((f) => ({
                  ...f,
                  coverImage: file,
                  coverPreview: URL.createObjectURL(file),
                }));
                setDirty(true);
              }}
            />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="text" onClick={() => setDialogOpen(false)}>
            İptal
          </Button>
          <Button disabled={!canSave} onClick={handleSave} color="blue">
            Kaydet
          </Button>
        </DialogFooter>
      </Dialog>

      {/* silme onayı */}
      <ConfirmModal
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirmed}
        message="Bu blogu silmek istediğinize emin misiniz?"
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
