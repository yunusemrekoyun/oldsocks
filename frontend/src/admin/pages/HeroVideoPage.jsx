import { useEffect, useRef, useState } from "react";
import {
  Button,
  Typography,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Tooltip,
  Chip,
  Spinner,
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
  const [selected, setSelected] = useState(null); // { url, kind }
  const [isFetching, setIsFetching] = useState(true);
  const [progress, setProgress] = useState(0);

  const inputRef = useRef(null);

  const fetchVideos = async () => {
    try {
      setIsFetching(true);
      const res = await api.get("/hero-videos");
      setVideos(res.data);
    } catch {
      setToast({ msg: "Medya listesi alınamadı", type: "error" });
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    // alan adı backend’de aynı: "video"
    formData.append("video", file);

    setLoading(true);
    setProgress(0);

    try {
      // onUploadProgress varsa ilerleme göstergesi
      await api.post("/hero-videos", formData, {
        onUploadProgress: (e) => {
          if (!e.total) return;
          const p = Math.round((e.loaded * 100) / e.total);
          setProgress(p);
        },
      });
      setFile(null);
      setProgress(0);
      inputRef.current && (inputRef.current.value = "");
      await fetchVideos();
      setToast({ msg: "Yükleme başarılı", type: "success" });
    } catch (err) {
      setToast({
        msg: err?.response?.data?.message || "Yükleme hatası",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/hero-videos/${confirmId}`);
      setConfirmId(null);
      fetchVideos();
      setToast({ msg: "Silindi", type: "success" });
    } catch {
      setToast({ msg: "Silme işlemi başarısız", type: "error" });
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const f = e.dataTransfer?.files?.[0];
    if (f) setFile(f);
  };

  const prevent = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="mx-auto max-w-[1400px]">
      {/* Page Header */}
      <div className="sticky top-0 z-10 -mx-4 sm:mx-0 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b">
        <div className="px-4 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0">
              <Typography variant="h4" className="!text-xl sm:!text-2xl">
                Hero Medyaları
              </Typography>
              <Typography variant="small" className="text-gray-600">
                En fazla 3 öğe yükleyebilirsiniz. (Video veya Görsel)
              </Typography>
            </div>

            {/* Uploader Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <label
                onDrop={onDrop}
                onDragOver={prevent}
                onDragEnter={prevent}
                onDragLeave={prevent}
                className="flex items-center justify-between gap-3 cursor-pointer border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50 transition w-full sm:w-72"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <ArrowUpTrayIcon className="w-5 h-5 text-gray-600 shrink-0" />
                  <span className="text-sm text-gray-700 truncate">
                    {file ? file.name : "Video/Görsel Seç veya Bırak"}
                  </span>
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,image/*"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="hidden"
                />
              </label>

              <Button
                color="blue"
                onClick={handleUpload}
                disabled={!file || loading}
                className="w-full sm:w-auto disabled:opacity-50"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner className="h-4 w-4" /> Yükleniyor…{" "}
                    {progress ? `${progress}%` : ""}
                  </span>
                ) : (
                  "Yükle"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Empty State / Loading */}
      {isFetching ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-40 sm:h-48 rounded-lg bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div
          className="m-4 rounded-xl border border-dashed p-10 text-center"
          onDrop={onDrop}
          onDragOver={prevent}
          onDragEnter={prevent}
          onDragLeave={prevent}
        >
          <ArrowUpTrayIcon className="mx-auto h-10 w-10 text-gray-400" />
          <Typography className="mt-3">Henüz medya yok</Typography>
          <Typography variant="small" className="text-gray-600">
            Eklemek için dosyayı sürükleyip bırakın ya da yukarıdan seçin.
          </Typography>
        </div>
      ) : null}

      {/* Cards */}
      {videos.length > 0 && (
        <div className="p-4">
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4">
            {videos.map((item) => (
              <div
                key={item._id}
                className="border rounded-lg overflow-hidden group relative cursor-pointer bg-white shadow-sm hover:shadow-md transition"
                onClick={() => setSelected({ url: item.url, kind: item.kind })}
              >
                <div className="relative w-full aspect-video bg-black">
                  {item.kind === "image" ? (
                    <img
                      src={item.url}
                      alt="Hero görseli"
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center text-white text-sm">
                      ▶ İzlemek için tıklayın
                    </div>
                  )}

                  {/* Type Badge */}
                  <div className="absolute left-2 bottom-2">
                    <Chip
                      value={item.kind === "image" ? "Görsel" : "Video"}
                      size="sm"
                      className="bg-black/60 text-white backdrop-blur"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="absolute top-2 right-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition">
                  <Tooltip content="Sil">
                    <Button
                      size="sm"
                      color="red"
                      variant="outlined"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmId(item._id);
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
        </div>
      )}

      {/* Silme Onayı */}
      <ConfirmModal
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={handleDelete}
        message="Bu öğeyi silmek istediğinize emin misiniz?"
      />

      {/* Media Önizleme */}
      <Dialog
        open={!!selected}
        handler={() => setSelected(null)}
        size="xl"
        className="!max-w-[95vw] sm:!max-w-3xl"
      >
        <DialogHeader>Önizleme</DialogHeader>
        <DialogBody className="overflow-hidden">
          {selected?.kind === "image" ? (
            <img
              src={selected.url}
              alt="Önizleme"
              className="w-full max-h-[75vh] object-contain rounded"
            />
          ) : (
            <video
              src={selected?.url}
              controls
              autoPlay
              className="w-full max-h-[75vh] rounded"
            />
          )}
        </DialogBody>
        <DialogFooter>
          <Button variant="text" onClick={() => setSelected(null)}>
            Kapat
          </Button>
        </DialogFooter>
      </Dialog>

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
