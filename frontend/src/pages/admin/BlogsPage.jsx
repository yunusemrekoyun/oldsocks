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

export default function BlogsPage() {
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
      .finally(() => setLoading(false));
  }, []);

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

  // ⚠️ Burayı async yapıp tekil blogu çekiyoruz
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
    } catch (err) {
      console.error("Blog yüklenemedi:", err);
      alert("Blog verisi alınırken hata oluştu.");
    }
  };

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

  const handleSave = async () => {
    if (!form.categories.length) {
      alert("En az bir kategori seçin.");
      return;
    }
    if (!form.author) {
      alert("Lütfen bir yazar seçin.");
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

    try {
      if (form._id) {
        await api.put(`/blogs/${form._id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post("/blogs", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      const { data } = await api.get("/blogs");
      setBlogs(data);
      setDialogOpen(false);
    } catch (err) {
      console.error(err);
      alert("Sunucudan hata döndü, konsolu kontrol edin.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bu blogu silmek istediğinize emin misiniz?")) {
      await api.delete(`/blogs/${id}`);
      setBlogs((bs) => bs.filter((b) => b._id !== id));
    }
  };

  if (loading) return <div>Yükleniyor…</div>;

  const canSave =
    dirty &&
    form.categories.length > 0 &&
    form.author &&
    form.title.trim() !== "" &&
    form.content.trim() !== "";

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Typography variant="h4">Bloglar</Typography>
        <Button color="blue" onClick={openNew}>
          + Yeni Blog
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {blogs.map((b) => (
          <Card key={b._id} className="relative">
            <Menu placement="bottom-end">
              <MenuHandler>
                <IconButton
                  variant="text"
                  ripple={false}
                  onClick={() => openEdit(b)}
                  className="absolute top-2 right-2"
                >
                  <EllipsisVerticalIcon className="w-5 h-5" />
                </IconButton>
              </MenuHandler>
              <MenuList>
                <MenuItem onClick={() => openEdit(b)}>
                  <PencilIcon className="w-4 h-4 mr-2" /> Güncelle
                </MenuItem>
                <MenuItem onClick={() => handleDelete(b._id)}>
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

      <Dialog open={dialogOpen} size="lg" handler={() => setDialogOpen(false)}>
        <DialogHeader>{form._id ? "Blogu Güncelle" : "Yeni Blog"}</DialogHeader>
        <DialogBody divider className="space-y-4 max-h-[70vh] overflow-y-auto">
          <Input
            label="Başlık"
            value={form.title}
            onChange={(e) => {
              setForm((f) => ({ ...f, title: e.target.value }));
              setDirty(true);
            }}
          />
          <Input
            label="Alt Başlık"
            value={form.subtitle}
            onChange={(e) => {
              setForm((f) => ({ ...f, subtitle: e.target.value }));
              setDirty(true);
            }}
          />
          <Input
            label="Kısa Açıklama"
            value={form.excerpt}
            onChange={(e) => {
              setForm((f) => ({ ...f, excerpt: e.target.value }));
              setDirty(true);
            }}
          />

          {/* Çok satırlı içerik */}
          <Textarea
            label="İçerik"
            value={form.content}
            onChange={(e) => {
              setForm((f) => ({ ...f, content: e.target.value }));
              setDirty(true);
            }}
            className="h-40"
          />

          {/* Kategori Seçimi */}
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

          {/* Yazar Seçimi */}
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
                <option key={u._1} value={u._id}>
                  {u.firstName} {u.lastName}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block mb-1 text-sm">Tags</label>
            <div className="flex flex-wrap gap-2 border rounded p-2">
              {form.tagsArray.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center bg-blue-100 text-blue-800 rounded-full px-2 py-1 text-sm"
                >
                  {tag}{" "}
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

          {/* Kapak Resmi */}
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
          <Button
            variant="text"
            onClick={() => setDialogOpen(false)}
            className="mr-2"
          >
            İptal
          </Button>
          <Button disabled={!canSave} onClick={handleSave} color="blue">
            Kaydet
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
