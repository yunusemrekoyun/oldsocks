// src/pages/admin/forms/AddNewColorForm.jsx
import React, { useEffect, useState } from "react";
import api from "../../../api";
import ToastAlert from "../../components/ui/ToastAlert";
import { v4 as uuid } from "uuid";
import { useUploadQueue } from "../../context/UploadQueueContext";
import {
  compressImageFileList,
  MAX_IMAGE_BYTES,
} from "../../utils/imageCompression";
import { normalizePricing, resolvePricingForSubmit } from "../../utils/pricing";

const Badge = ({ children }) => (
  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
    {children}
  </span>
);

export default function AddNewColorForm({ product, onClose, onSaved }) {
  const [formData, setFormData] = useState({
    name: "",
    originalPrice: "",
    discount: "",
    price: "",
    description: "",
    color: "",
    sizes: [],
  });

  const [video, setVideo] = useState(null);
  const [images, setImages] = useState([]);
  const [existingVideo, setExistV] = useState("");
  const [existingImages, setExistI] = useState([]);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isSizeLess, setIsSizeLess] = useState(false);

  const { addTask, updateTask, removeTask } = useUploadQueue();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/products/${product._id}`);
        const pricing = normalizePricing(
          {
            originalPrice: data.originalPrice ?? "",
            discount: data.discount ?? "",
            price: data.price ?? "",
          },
          undefined
        );

        setFormData({
          name: data.name ?? "",
          originalPrice: pricing.values.originalPrice,
          discount: pricing.values.discount,
          price: pricing.values.price,
          description: data.description ?? "",
          color: "",
          sizes: data.sizes?.length ? data.sizes : [],
        });
        setExistV(data.video);
        setExistI(data.images || []);
      } catch (err) {
        console.error("Ürün detayları alınamadı:", err);
      }
    })();
  }, [product]);

  /* ---------- Fiyat hesaplama (üçlü) ---------- */
  const toNumber = (value) => {
    if (value === null || value === undefined || value === "") return null;
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  };

  const originalNumber = toNumber(formData.originalPrice);
  const priceNumber = toNumber(formData.price);

  const pricingReady = originalNumber !== null && priceNumber !== null;
  const hasDiscount =
    pricingReady && priceNumber !== null && originalNumber !== null
      ? priceNumber < originalNumber - 0.005
      : false;
  const original = originalNumber ?? 0;
  const finalPrice = priceNumber ?? 0;

  const numericFieldCount = [
    formData.originalPrice,
    formData.price,
    formData.discount,
  ].reduce((count, val) => {
    if (val === "" || val === null || val === undefined) return count;
    const num = Number(val);
    return Number.isFinite(num) ? count + 1 : count;
  }, 0);

  const canComputePricing = numericFieldCount >= 2;

  const handleComputePricing = () => {
    setToast(null);
    const result = normalizePricing(
      {
        originalPrice: formData.originalPrice,
        discount: formData.discount,
        price: formData.price,
      },
      undefined
    );

    const numbers = result.numbers;
    if (numbers.original === null || numbers.price === null) {
      setToast({
        msg: "Fiyatı hesaplamak için geçerli iki alan girin.",
        type: "error",
      });
      return;
    }

    setFormData((prev) => ({ ...prev, ...result.values }));
  };

  const fmt = (n) =>
    `₺${Number(n || 0).toLocaleString("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  const updatePricingField = (field, rawValue) => {
    setToast(null);
    setFormData((prev) => ({ ...prev, [field]: rawValue }));
  };

  const handleInput = (e) => {
    const { name, value } = e.target;
    setToast(null);
    if (name === "originalPrice" || name === "discount" || name === "price") {
      updatePricingField(name, value);
      return;
    }
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSizeChange = (i, key, value) =>
    setFormData((p) => {
      const list = [...p.sizes];
      list[i][key] = key === "stock" ? Number(value) : value;
      return { ...p, sizes: list };
    });

  const addSizeRow = () =>
    setFormData((p) => ({
      ...p,
      sizes: [...p.sizes, { id: uuid(), size: "", stock: 0 }],
    }));

  const removeSizeRow = (id) =>
    setFormData((p) => ({ ...p, sizes: p.sizes.filter((s) => s.id !== id) }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.color.trim())
      return setToast({ msg: "Renk alanı zorunludur.", type: "error" });
    if (!isSizeLess && formData.sizes.length === 0)
      return setToast({
        msg: "En az bir beden satırı ekleyin.",
        type: "error",
      });
    const pricingResult = resolvePricingForSubmit({
      originalPrice: formData.originalPrice,
      discount: formData.discount,
      price: formData.price,
    });

    if (!pricingResult.valid) {
      return setToast({
        msg: "Fiyatı hesaplamak için en az iki alanı doldurup 'Fiyatı Hesapla' butonuna basın.",
        type: "error",
      });
    }

    const fd = new FormData();
    // Backend şeması: price = hesaplanan; originalPrice & discount olduğu gibi
    fd.append("name", formData.name || "");
    fd.append("price", pricingResult.values.price);
    fd.append("originalPrice", pricingResult.values.originalPrice);
    fd.append("discount", pricingResult.values.discount || "0.00");
    fd.append("description", formData.description || "");
    fd.append("color", formData.color.trim());
    fd.append(
      "sizes",
      JSON.stringify(
        isSizeLess
          ? [{ size: "", stock: formData.sizes[0]?.stock || 0 }]
          : formData.sizes
      )
    );
    if (video) fd.append("video", video);
    images.forEach((img) => fd.append("images", img));

    const taskId = uuid();
    addTask({
      id: taskId,
      name: `Renk ekleniyor: ${formData.color || "Yeni renk"}`,
      progress: 0,
    });

    try {
      setSubmitting(true);
      await api.post(`/products/new-color/${product._id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (ev) =>
          updateTask(taskId, {
            progress: Math.round((ev.loaded * 100) / ev.total),
          }),
      });

      updateTask(taskId, { progress: 100, status: "success" });
      setTimeout(() => removeTask(taskId), 1800);

      setToast({ msg: "Yeni renk eklendi.", type: "success" });
      onSaved();
    } catch (err) {
      updateTask(taskId, {
        progress: 100,
        status: "error",
        errorMsg:
          err?.response?.data?.message || "Yeni renk eklenirken hata oluştu.",
      });
      setTimeout(() => removeTask(taskId), 4000);

      setToast({
        msg:
          err?.response?.data?.message || "Yeni renk eklenirken hata oluştu.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8 bg-white p-6 rounded-lg shadow-md overflow-auto max-h-[calc(100vh-12rem)]"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SOL: FORM */}
        <div className="space-y-4">
          {/* Renk */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Yeni Renk *
            </label>
            <input
              name="color"
              value={formData.color}
              onChange={handleInput}
              placeholder="Örn. Kırmızı"
              className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500"
            />
          </div>

          {/* Fiyatlar (Yeni Mantık) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Orijinal Fiyat *
              </label>
              <input
                type="number"
                name="originalPrice"
                min="0"
                step="0.01"
                value={formData.originalPrice}
                onChange={handleInput}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Örn. 699.90"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                İndirim (%)
              </label>
              <input
                type="number"
                name="discount"
                min="0"
                max="100"
                step="0.01"
                value={formData.discount}
                onChange={handleInput}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Örn. 20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                İndirimli Fiyat
              </label>
              <input
                type="number"
                name="price"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleInput}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Örn. 559.90"
              />
            </div>
          </div>
          <div className="flex justify-end mt-2">
            <button
              type="button"
              onClick={handleComputePricing}
              disabled={!canComputePricing}
              className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                canComputePricing
                  ? "border-blue-600 text-blue-600 hover:bg-blue-50"
                  : "border-gray-300 text-gray-400 cursor-not-allowed"
              }`}
            >
              Fiyatı Hesapla
            </button>
          </div>

          {/* Bedensiz toggle */}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isSizeLess}
              onChange={(e) => {
                setIsSizeLess(e.target.checked);
                setFormData((p) => ({
                  ...p,
                  sizes: e.target.checked
                    ? [{ id: uuid(), size: "", stock: 0 }]
                    : [],
                }));
              }}
            />
            Bedensiz ürün (tek stok)
          </label>

          {/* Beden & Stok */}
          {!isSizeLess && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">
                  Beden & Stok Satırları
                </label>
                <button
                  type="button"
                  onClick={addSizeRow}
                  className="text-blue-600 text-sm"
                >
                  + Satır Ekle
                </button>
              </div>

              {formData.sizes.map(({ id, size, stock }, i) => (
                <div key={id} className="flex items-center gap-3">
                  <input
                    value={size}
                    onChange={(e) =>
                      handleSizeChange(i, "size", e.target.value)
                    }
                    placeholder="Beden"
                    className="flex-1 px-3 py-2 border rounded-lg"
                  />
                  <input
                    value={stock}
                    type="number"
                    onChange={(e) =>
                      handleSizeChange(i, "stock", e.target.value)
                    }
                    placeholder="Stok"
                    className="w-32 px-3 py-2 border rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeSizeRow(id)}
                    className="text-red-500"
                    title="Satırı sil"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Yeni Medya / Mevcut Önizlemeler */}
          <div className="space-y-4">
            {existingVideo && !video && (
              <section>
                <label className="block mb-1 font-medium">Mevcut Video</label>
                <video
                  src={existingVideo}
                  controls
                  className="w-full rounded-lg shadow"
                />
              </section>
            )}
            {existingImages.length > 0 && images.length === 0 && (
              <section>
                <label className="block mb-1 font-medium">
                  Mevcut Görseller
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {existingImages.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt=""
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                  ))}
                </div>
              </section>
            )}

            <div>
              <label className="block text-sm mb-1 font-medium">
                Yeni Video (Opsiyonel)
              </label>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setVideo(e.target.files[0])}
                className="text-sm"
              />
            </div>
            <div>
              <label className="block text-sm mb-1 font-medium">
                Yeni Görseller
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={async (e) => {
                  const { files } = e.target;
                  if (!files || files.length === 0) {
                    setImages([]);
                    return;
                  }
                  const { processed, failed } = await compressImageFileList(
                    files,
                    { maxBytes: MAX_IMAGE_BYTES }
                  );
                  e.target.value = "";
                  if (failed.length) {
                    const maxMb = Math.round((MAX_IMAGE_BYTES / (1024 * 1024)) * 10) / 10;
                    setToast({
                      msg: `${failed
                        .map((f) => f.name)
                        .join(", ")} görseli sıkıştırılamadı. Lütfen ${maxMb}MB altında dosyalar seçin.`,
                      type: "error",
                    });
                  }
                  if (processed.length) {
                    setImages(processed);
                  }
                }}
                className="text-sm"
              />
            </div>
          </div>

          {/* Alt Butonlar */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-100"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={submitting || !pricingReady}
              className={`px-4 py-2 rounded-lg text-white ${
                submitting || !pricingReady
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              Kaydet
            </button>
          </div>

          {toast && <ToastAlert {...toast} onClose={() => setToast(null)} />}
        </div>

        {/* SAĞ: Hızlı Önizleme */}
        <div className="rounded-xl border overflow-hidden">
          <div className="p-4">
            <p className="font-medium line-clamp-1">
              {formData.name || "Ürün adı"}
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              {hasDiscount ? (
                <>
                  <span className="text-xs text-gray-400 line-through">
                    {original ? fmt(original) : "—"}
                  </span>
                  <span className="text-blue-700 font-semibold">
                    {finalPrice ? fmt(finalPrice) : "—"}
                  </span>
                </>
              ) : (
                <span className="text-blue-700 font-semibold">
                  {finalPrice ? fmt(finalPrice) : original ? fmt(original) : "Fiyat"}
                </span>
              )}
              {formData.color && <Badge>{formData.color}</Badge>}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
