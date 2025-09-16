import { useEffect, useState } from "react";
import {
  Button,
  Typography,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Tooltip,
} from "@material-tailwind/react";
import { ArrowUpTrayIcon, TrashIcon } from "@heroicons/react/24/outline";
import ToastAlert from "../../components/ui/ToastAlert";
import api from "../../../api";

/* Silme Onay Modali */
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

export default function HeroVideoPage() {
  const [videos, setVideos] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null); // Video Modal

  const fetchVideos = async () => {
    try {
      const res = await api.get("/hero-videos");
      setVideos(res.data);
    } catch {
      setToast({ msg: "Videolar alınamadı", type: "error" });
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("video", file);

    setLoading(true); // ⏳ Yükleme başlıyor

    try {
      await api.post("/hero-videos", formData);
      setFile(null);
      await fetchVideos();
      setToast({ msg: "Video başarıyla yüklendi", type: "success" });
    } catch (err) {
      setToast({
        msg: err?.response?.data?.message || "Yükleme hatası",
        type: "error",
      });
    } finally {
      setLoading(false); // ✅ Bitti
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/hero-videos/${confirmId}`);
      setConfirmId(null);
      fetchVideos();
      setToast({ msg: "Video silindi", type: "success" });
    } catch {
      setToast({ msg: "Silme işlemi başarısız", type: "error" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Başlık & Yükleyici */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Typography variant="h4">Hero Videolar</Typography>
          <Typography variant="small" className="text-gray-600">
            En fazla 3 video yükleyebilirsiniz.
          </Typography>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50 transition">
            <ArrowUpTrayIcon className="w-5 h-5 text-gray-600" />
            <span className="text-sm text-gray-700">
              {file ? file.name : "Video Seç"}
            </span>
            <input
              type="file"
              accept="video/mp4"
              onChange={(e) => setFile(e.target.files[0])}
              className="hidden"
            />
          </label>
          <Button
            color="blue"
            onClick={handleUpload}
            disabled={!file || loading}
            className="disabled:opacity-50"
          >
            {loading ? "Yükleniyor..." : "Yükle"}
          </Button>
        </div>
      </div>

      {/* Video Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {videos.map((vid) => (
          <div
            key={vid._id}
            className="border rounded-lg overflow-hidden group relative cursor-pointer hover:shadow-lg transition"
            onClick={() => setSelectedVideo(vid.url)}
          >
            <div className="h-56 bg-black flex items-center justify-center text-white text-sm">
              <span>▶ İzlemek için tıklayın</span>
            </div>

            {/* Hover ile Sil */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
              <Tooltip content="Sil">
                <Button
                  size="sm"
                  color="red"
                  variant="outlined"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmId(vid._id);
                  }}
                  className="px-2 py-1"
                >
                  <TrashIcon className="w-4 h-4" />
                </Button>
              </Tooltip>
            </div>
          </div>
        ))}
      </div>

      {/* Silme Onayı */}
      <ConfirmModal
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={handleDelete}
        message="Bu videoyu silmek istediğinize emin misiniz?"
      />

      {/* Video İzleme Popup */}
      <Dialog
        open={!!selectedVideo}
        handler={() => setSelectedVideo(null)}
        size="xl"
      >
        <DialogHeader>Video Önizleme</DialogHeader>
        <DialogBody className="overflow-hidden">
          <video
            src={selectedVideo}
            controls
            autoPlay
            className="w-full max-h-[70vh] rounded"
          />
        </DialogBody>
        <DialogFooter>
          <Button variant="text" onClick={() => setSelectedVideo(null)}>
            Kapat
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Toast Bildirim */}
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