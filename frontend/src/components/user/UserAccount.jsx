import React, { useContext, useEffect, useState } from "react";
import api from "../../../api"; // axios instance, otomatik multipart desteği var
import { AuthContext } from "../../context/AuthContext";
import defaultAvatar from "../../assets/user/fallback-avatar.png";
import { FaTrashAlt, FaCamera, FaUpload } from "react-icons/fa";

export default function UserAccount() {
  const { isLoggedIn } = useContext(AuthContext);

  const [user, setUser] = useState(null);
  const [profilePic, setProfilePic] = useState(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      setError("Oturum açılmamış");
      return;
    }
    setError("");
    api
      .get("/users/me")
      .then((res) => setUser(res.data))
      .catch((err) =>
        setError(err.response?.data?.message || "Profil alınamadı")
      );

    api
      .get("/profile-pictures")
      .then((res) => setProfilePic(res.data))
      .catch(() => setProfilePic(null));
  }, [isLoggedIn]);

  // Resmi sıkıştırma fonksiyonu
  const compressImage = (file, maxSizeMB = 2, maxWidth = 1024) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          let { width, height } = img;
          if (width > maxWidth) {
            height = height * (maxWidth / width);
            width = maxWidth;
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          let quality = 0.9;
          const step = 0.05;
          const compress = () => {
            canvas.toBlob(
              (blob) => {
                if (blob.size <= maxSizeMB * 1024 * 1024 || quality <= step) {
                  resolve(new File([blob], file.name, { type: file.type }));
                } else {
                  quality -= step;
                  compress();
                }
              },
              file.type,
              quality
            );
          };
          compress();
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileChange = (e) => {
    setError("");
    const selected = e.target.files[0];
    if (selected) setFile(selected);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Lütfen bir dosya seçin.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    let uploadFile = file;
    try {
      if (file.size > 2 * 1024 * 1024) {
        // 2 MB'den büyükse sıkıştır
        uploadFile = await compressImage(file, 2, 1024);
      }
    } catch {
      setError("Resim sıkıştırılamadı.");
      setLoading(false);
      return;
    }

    const fd = new FormData();
    fd.append("picture", uploadFile);

    try {
      const res = await api.post("/profile-pictures", fd);
      setProfilePic(res.data);
      setFile(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Yükleme hatası");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setError("");
    try {
      await api.delete("/profile-pictures");
      setProfilePic(null);
      setShowDeleteConfirm(false);
    } catch (err) {
      setError(err.response?.data?.message || "Silme hatası");
    }
  };

  if (error)
    return <div className="text-red-500 text-center mt-10">{error}</div>;
  if (!user) return <div className="text-center mt-10">Yükleniyor…</div>;

  const isDefault = !profilePic?.url;

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8 mt-12 border border-light2">
      <h2 className="text-3xl font-semibold text-dark1 text-center mb-6">
        Merhaba, <span className="text-blue-700">{user.firstName}</span>!
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-dark2 text-sm sm:text-base">
        <div>
          <span className="font-semibold block mb-1">Email</span>
          <p className="bg-light1 p-3 rounded-lg border border-light2">
            {user.email}
          </p>
        </div>
        <div>
          <span className="font-semibold block mb-1">Telefon</span>
          <p className="bg-light1 p-3 rounded-lg border border-light2">
            {user.phone || "-"}
          </p>
        </div>
      </div>

      <div className="mt-10 pt-6 border-t border-light2">
        <h3 className="text-xl font-semibold text-dark1 mb-5">Profil Resmi</h3>
        <div className="flex items-center gap-6 flex-wrap">
          <div className="relative group w-32 h-32 shrink-0">
            <img
              src={profilePic?.url || defaultAvatar}
              alt="Profil"
              className="w-full h-full rounded-full object-cover border-4 border-light2 shadow-md"
            />
            <label
              htmlFor="fileUpload"
              className="absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center cursor-pointer text-white text-xs text-center px-2"
            >
              {isDefault ? (
                <>
                  {" "}
                  <FaUpload className="mb-1" />
                  Profil Resmi Ekle
                </>
              ) : (
                <>
                  {" "}
                  <FaCamera className="mb-1" />
                  Profil Resmini Güncelle
                </>
              )}
            </label>
            {profilePic && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="absolute -top-2 -right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition"
                title="Sil"
              >
                <FaTrashAlt size={14} />
              </button>
            )}
            <input
              id="fileUpload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {file && (
            <div className="flex flex-col gap-3">
              <button
                onClick={handleUpload}
                disabled={loading}
                className="px-4 py-2 bg-dark1 text-white rounded-lg hover:bg-dark2 transition text-sm disabled:opacity-50"
              >
                {loading ? "Yükleniyor..." : "Güncelle"}
              </button>
              {success && (
                <p className="text-green-600 text-sm">Başarıyla güncellendi.</p>
              )}
              <p className="text-xs text-gray-500">
                Yeni bir resim seçildi, yüklemek için "Güncelle"ye tıkla.
              </p>
            </div>
          )}
        </div>

        {showDeleteConfirm && (
          <div className="mt-6 bg-light1 border border-light2 p-4 rounded-xl">
            <p className="text-sm mb-4">
              Profil resmini silmek istediğinizden emin misiniz?
            </p>
            <div className="flex gap-4">
              <button
                onClick={handleDelete}
                className="px-4 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
              >
                Evet, Sil
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-1 bg-gray-200 text-sm rounded-lg hover:bg-gray-300"
              >
                Vazgeç
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
