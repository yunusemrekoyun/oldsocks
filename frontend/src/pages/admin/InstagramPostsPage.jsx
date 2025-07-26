// src/pages/admin/InstagramPostsPage.jsx
import React, { useEffect, useState } from "react";
import {
  Card,
  CardBody,
  Typography,
  Button,
  Input,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  IconButton,
  Switch,
} from "@material-tailwind/react";
import { PencilIcon, TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import api from "../../../api";

export default function InstagramPostsPage() {
  const [posts, setPosts] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    _id: null,
    embedLink: "",
    caption: "",
    active: true,
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data } = await api.get("/instagram-posts");
    setPosts(data);
  };

  const handleOpen = (
    post = { _id: null, embedLink: "", caption: "", active: true }
  ) => {
    setForm(post);
    setOpen(true);
  };

  const handleClose = () => {
    setForm({ _id: null, embedLink: "", caption: "", active: true });
    setOpen(false);
  };

  const handleSubmit = async () => {
    if (!form.embedLink.trim()) return alert("Embed URL boş olamaz");
    try {
      const payload = {
        embedLink: form.embedLink.trim(),
        caption: form.caption.trim(),
        active: form.active,
      };

      if (form._id) {
        await api.put(`/instagram-posts/${form._id}`, payload);
      } else {
        // Yeni ekleme: backend 200 dönerse zaten mevcut; 201 olursa yeni yaratıldı.
        const response = await api.post("/instagram-posts", payload);
        if (response.status === 200 && response.data.message) {
          alert(response.data.message); // "Bu gönderi zaten mevcut."
          fetchPosts();
          handleClose();
          return;
        }
      }
    } catch (err) {
      console.error("Gönderi eklenirken hata oluştu:", err.response?.data);
      alert("Gönderi eklenirken hata oluştu: " + err.response?.data?.message);
      return;
    }

    fetchPosts();
    handleClose();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bu gönderiyi silmek istediğinizden emin misiniz?")) {
      await api.delete(`/instagram-posts/${id}`);
      fetchPosts();
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <Typography variant="h4">Instagram Gönderileri</Typography>
        <Button
          color="blue"
          className="flex items-center gap-2"
          onClick={() => handleOpen()}
        >
          <PlusIcon className="h-5 w-5" />
          Yeni Gönderi
        </Button>
      </div>

      <Card>
        <CardBody className="space-y-4">
          {posts.length === 0 ? (
            <Typography>Henüz gönderi eklenmemiş.</Typography>
          ) : (
            posts.map((post) => (
              <div
                key={post._id}
                className="flex flex-col md:flex-row md:justify-between md:items-center border p-4 rounded-md gap-2"
              >
                <div className="flex-1">
                  <Typography className="truncate font-medium text-blue-800">
                    {post.embedLink}
                  </Typography>
                  {post.caption && (
                    <Typography className="text-sm text-gray-600 mt-1">
                      {post.caption}
                    </Typography>
                  )}
                  <Typography
                    className={`text-xs mt-1 ${
                      post.active ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {post.active ? "Aktif" : "Pasif"}
                  </Typography>
                </div>
                <div className="flex gap-2 self-end md:self-auto">
                  <IconButton
                    variant="text"
                    color="blue"
                    onClick={() => handleOpen(post)}
                  >
                    <PencilIcon className="h-5 w-5" />
                  </IconButton>
                  <IconButton
                    variant="text"
                    color="red"
                    onClick={() => handleDelete(post._id)}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </IconButton>
                </div>
              </div>
            ))
          )}
        </CardBody>
      </Card>

      {/* Dialog */}
      <Dialog open={open} handler={handleClose}>
        <DialogHeader>
          {form._id ? "Gönderiyi Düzenle" : "Yeni Gönderi Ekle"}
        </DialogHeader>
        <DialogBody>
          <div className="grid gap-4">
            <Input
              label="Instagram Embed URL"
              value={form.embedLink}
              onChange={(e) =>
                setForm((f) => ({ ...f, embedLink: e.target.value }))
              }
            />
            <Input
              label="Açıklama (isteğe bağlı)"
              value={form.caption}
              onChange={(e) =>
                setForm((f) => ({ ...f, caption: e.target.value }))
              }
            />
            <div className="flex items-center justify-between">
              <Typography className="text-sm">Gönderi Aktif mi?</Typography>
              <Switch
                checked={form.active}
                onChange={(e) =>
                  setForm((f) => ({ ...f, active: e.target.checked }))
                }
              />
            </div>
            <Typography variant="small" className="text-gray-600">
              Örn: https://www.instagram.com/p/XXXXXXXXX/embed
            </Typography>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="text" onClick={handleClose}>
            Vazgeç
          </Button>
          <Button color="blue" onClick={handleSubmit}>
            Kaydet
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
