import React, { useContext, useEffect, useState } from "react";
import api from "../../../api";
import { AuthContext } from "../../context/AuthContext";
import defaultAvatar from "../../assets/blog/blog-owner/author.png";

export default function UserAccount() {
  const { isLoggedIn } = useContext(AuthContext);
  const [user, setUser] = useState(null);
  const [profilePic, setProfilePic] = useState(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");

  // Kullanıcı ve profil fotoğrafını çek
  useEffect(() => {
    if (!isLoggedIn) {
      setError("Oturum açılmamış");
      return;
    }

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

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = () => {
    if (!file) return setError("Lütfen bir dosya seçin.");
    const fd = new FormData();
    fd.append("picture", file);
    api
      .post("/profile-pictures", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => setProfilePic(res.data))
      .catch((err) =>
        setError(err.response?.data?.message || "Yükleme hatası")
      );
  };

  const handleDelete = () => {
    if (!window.confirm("Profil resmini silmek ister misiniz?")) return;
    api
      .delete("/profile-pictures")
      .then(() => setProfilePic(null))
      .catch((err) => setError(err.response?.data?.message || "Silme hatası"));
  };

  if (error) return <div className="text-red-500">{error}</div>;
  if (!user) return <div>Yükleniyor…</div>;

  return (
    <div className="p-6 bg-white rounded shadow-md space-y-4">
      <h2 className="text-xl font-bold">Hoş geldin, {user.firstName}!</h2>
      <p>
        <strong>Email:</strong> {user.email}
      </p>
      <p>
        <strong>Telefon:</strong> {user.phone || "-"}
      </p>

      <div className="mt-4">
        <h3 className="font-semibold mb-2">Profil Resmin</h3>
        <div className="flex items-center gap-4 mb-2">
          <img
            src={profilePic?.url || defaultAvatar}
            alt="Profil"
            className="w-24 h-24 rounded-full object-cover"
          />
          {profilePic && (
            <button
              onClick={handleDelete}
              className="px-3 py-1 bg-red-500 text-white rounded"
            >
              Sil
            </button>
          )}
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="mt-2"
        />
        <button
          onClick={handleUpload}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
        >
          {profilePic ? "Güncelle" : "Yükle"}
        </button>
      </div>
    </div>
  );
}
