// src/admin/pages/HeroVideoPage.jsx
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
import {
  ArrowUpTrayIcon,
  TrashIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import ToastAlert from "../../components/ui/ToastAlert";
import api from "../../../api";
import { v4 as uuidv4 } from "uuid";
import { useUploadQueue } from "../../context/UploadQueueContext";

/* ───── Görsel/Video yardımcıları ───── */
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // ≈10MB hedef (gerekirse sıkıştır)
const IMAGE_TARGET_WIDTH = 1920; // hero için güvenli genişlik
const JPEG_START_QUALITY = 0.92;
const JPEG_MIN_QUALITY = 0.85;

// Videoları client-side transcode edemiyoruz; yalnızca rehber uyarılar:
const ACCEPTED_VIDEO_MIMES = [
  "video/mp4",
  "video/webm",
  "video/quicktime", // mov
];

const isHeic = (file) => {
  const name = (file?.name || "").toLowerCase();
  const type = (file?.type || "").toLowerCase();
  return (
    name.endsWith(".heic") ||
    name.endsWith(".heif") ||
    type.includes("heic") ||
    type.includes("heif")
  );
};
const isImage = (file) => (file?.type || "").startsWith("image/");
const isVideo = (file) => (file?.type || "").startsWith("video/");

const ensureJpegName = (name = "image.jpg") =>
  name.replace(/\.[^.]+$/, "") + ".jpg";

/** Gerekiyorsa görseli JPEG'e dönüştürüp ~1920px genişliğe indirger; kalite alt sınırını 0.85'te tutar */
async function maybeOptimizeImage(file) {
  // PNG/JPEG dışı ise (ör. WEBP), ya da boyut çok büyükse JPEG'e dönüştürüp downscale yapalım
  const mustConvert =
    !["image/jpeg", "image/png"].includes(file.type) ||
    file.size > MAX_IMAGE_BYTES;

  if (!mustConvert) {
    // Küçük ve zaten JPEG/PNG ise dokunma
    return { file, previewUrl: URL.createObjectURL(file), converted: false };
  }

  // HEIC'i tarayıcı decode edemez — burada zaten daha önce engelliyoruz.
  // File -> DataURL
  const dataUrl = await new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = () => reject(new Error("Dosya okunamadı."));
    fr.readAsDataURL(file);
  });

  // DataURL -> Image
  const img = await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Görsel yüklenemedi."));
    image.src = dataUrl;
  });

  // Oranı koruyarak (büyütmeden) 1920 genişliğe sığdır
  const scale = Math.min(1, IMAGE_TARGET_WIDTH / img.width);
  const targetW = Math.round(img.width * scale);
  const targetH = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, targetW, targetH);

  // Kaliteyi yüksek tut; yalnızca çok büyük kalırsa ufak düş
  let q = JPEG_START_QUALITY;
  let blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", q));
  if (!blob) throw new Error("Görsel dönüştürülemedi.");

  while (blob.size > MAX_IMAGE_BYTES && q > JPEG_MIN_QUALITY) {
    q = Math.max(JPEG_MIN_QUALITY, q - 0.02); // küçük adımlarla
    blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", q));
    if (!blob) break;
  }

  if (!blob) throw new Error("Görsel dönüştürülemedi (blob).");

  const outFile = new File([blob], ensureJpegName(file.name), {
    type: "image/jpeg",
  });
  const previewUrl = URL.createObjectURL(blob);
  return {
    file: outFile,
    previewUrl,
    converted: true,
    width: targetW,
    height: targetH,
    quality: q,
  };
}

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
  const [file, setFile] = useState(null); // kullanıcı seçiminden sonra (optimize edilmiş olabilir)
  const [rawFile, setRawFile] = useState(null); // kullanıcıdan gelen ham dosya (bilgilendirme için)
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [selected, setSelected] = useState(null); // { url, kind }
  const [isFetching, setIsFetching] = useState(true);
  const [progress, setProgress] = useState(0);

  const inputRef = useRef(null);
  const { addTask, updateTask, removeTask } = useUploadQueue();

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

  /* ————— Dosya seçimi / drop ————— */
  const handlePickedFile = async (picked) => {
    if (!picked) return;

    // Limit doluysa yeni seçim yapılmasın
    if (videos.length >= 3) {
      setToast({
        msg: "En fazla 3 hero medyası yükleyebilirsiniz. Lütfen önce birini silin.",
        type: "error",
      });
      inputRef.current && (inputRef.current.value = "");
      return;
    }

    // HEIC engelle
    if (isHeic(picked)) {
      setToast({
        msg: "HEIC/HEIF desteklenmiyor. Lütfen JPG/PNG veya MP4/WebM/MOV seçin.",
        type: "error",
      });
      inputRef.current && (inputRef.current.value = "");
      return;
    }

    // Video için sadece bilgilendirme (transcode yok)
    if (isVideo(picked)) {
      const t = (picked.type || "").toLowerCase();
      if (!ACCEPTED_VIDEO_MIMES.includes(t)) {
        setToast({
          msg: "Bu video formatı tarayıcıda sorun çıkarabilir. MP4 (H.264/AAC) veya WebM önerilir.",
          type: "warning",
        });
      }
      // 50MB üzeri ise uyar (server limiti bilinmiyor, kullanıcıyı bilgilendir)
      if (picked.size > 50 * 1024 * 1024) {
        setToast({
          msg: "Video dosyası çok büyük görünüyor (>50MB). Yükleme uzun sürebilir veya reddedilebilir.",
          type: "warning",
        });
      }
      setRawFile(picked);
      setFile(picked); // video optimize etmiyoruz
      return;
    }

    // Görsel: gerekiyorsa temkinli optimize et
    if (isImage(picked)) {
      try {
        const {
          file: out,
          converted,
        } = await maybeOptimizeImage(picked);
        setRawFile(picked);
        setFile(out);
        setToast({
          msg: converted
            ? "Görsel optimize edildi (yaklaşık 1920px genişlik, yüksek kalite)."
            : "Görsel yüklenecek.",
          type: "info",
        });
      } catch (err) {
        console.error("Image optimize error:", err);
        setToast({
          msg: err?.message || "Görsel işlenemedi. Lütfen JPG/PNG deneyin.",
          type: "error",
        });
        inputRef.current && (inputRef.current.value = "");
      }
      return;
    }

    // Diğer tüm türler
    setToast({
      msg: "Sadece video veya görsel yükleyebilirsiniz.",
      type: "error",
    });
    inputRef.current && (inputRef.current.value = "");
  };

  const onDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const f = e.dataTransfer?.files?.[0];
    await handlePickedFile(f);
  };

  const prevent = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  /* ————— Upload ————— */
  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    // backend alan adı: "video" (image/video fark etmiyor)
    formData.append("video", file);

    setLoading(true);
    setProgress(0);

    // UploadQueue
    const taskId = uuidv4();
    addTask({
      id: taskId,
      name: file?.name || "Hero Medya",
      progress: 0,
    });

    try {
      await api.post("/hero-videos", formData, {
        onUploadProgress: (e) => {
          if (!e.total) return;
          const p = Math.round((e.loaded * 100) / e.total);
          setProgress(p);
          updateTask(taskId, { progress: p });
        },
      });

      setFile(null);
      setRawFile(null);
      setProgress(0);
      inputRef.current && (inputRef.current.value = "");
      await fetchVideos();

      setToast({ msg: "Yükleme başarılı", type: "success" });
      updateTask(taskId, { progress: 100, status: "success" });
      setTimeout(() => removeTask(taskId), 2000);
    } catch (err) {
      const msg = err?.response?.data?.message || "Yükleme hatası";
      setToast({ msg, type: "error" });
      updateTask(taskId, {
        progress: 100,
        status: "error",
        errorMsg: msg,
      });
      setTimeout(() => removeTask(taskId), 4000);
    } finally {
      setLoading(false);
    }
  };

  /* ————— Delete ————— */
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

              {/* Limit info bandı */}
              {videos.length >= 3 && (
                <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 text-amber-900 p-2 text-sm flex items-start gap-2">
                  <ExclamationTriangleIcon className="w-5 h-5 mt-0.5 shrink-0" />
                  <div>
                    Maksimum <b>3</b> hero medyası eklenebilir. Yeni bir medya
                    yüklemek için önce mevcutlardan birini silin.
                  </div>
                </div>
              )}
            </div>

            {/* Uploader Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <label
                onDrop={onDrop}
                onDragOver={prevent}
                onDragEnter={prevent}
                onDragLeave={prevent}
                className="flex items-center justify-between gap-3 cursor-pointer border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50 transition w-full sm:w-80"
                title="MP4/WebM/QuickTime video veya JPG/PNG görsel yükleyin. HEIC desteklenmez."
              >
                <div className="flex items-center gap-2 min-w-0">
                  <ArrowUpTrayIcon className="w-5 h-5 text-gray-600 shrink-0" />
                  <span className="text-sm text-gray-700 truncate">
                    {rawFile ? rawFile.name : "Video/Görsel Seç veya Bırak"}
                  </span>
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,image/*"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    await handlePickedFile(f);
                  }}
                  className="hidden"
                />
              </label>

              <Button
                color="blue"
                onClick={handleUpload}
                disabled={!file || loading || videos.length >= 3}
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
            Video veya görsel eklemek için dosyayı sürükleyip bırakın ya da
            yukarıdan seçin.
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
                      className="bg-black/60 text-white backdrop-blur rounded-full"
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
