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

  if (error) return <div className="text-red-500 text-center mt-10">{error}</div>;
  if (!user) return <div className="text-center mt-10">Yükleniyor…</div>;

  return (
    <div className="max-w-xl mx-auto bg-white shadow-xl rounded-2xl p-8 mt-10 space-y-6 border border-gray-200">
      <h2 className="text-2xl font-semibold text-gray-800 text-center">
        Hoş geldin, <span className="text-blue-600">{user.firstName}</span>!
      </h2>

      <div className="space-y-2 text-sm sm:text-base text-gray-700">
        <p><span className="font-medium">Email:</span> {user.email}</p>
        <p><span className="font-medium">Telefon:</span> {user.phone || "-"}</p>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-lg font-semibold mb-3 text-gray-800">Profil Resmin</h3>
        <div className="flex items-center gap-5 flex-wrap">
          <img
            src={profilePic?.url || defaultAvatar}
            alt="Profil"
            className="w-28 h-28 rounded-full object-cover ring-2 ring-blue-500 shadow-md hover:scale-105 transition-transform duration-300"
          />
          <div className="space-y-2">
            {profilePic && (
              <button
                onClick={handleDelete}
                className="px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full text-sm transition"
              >
                Sil
              </button>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block text-sm text-gray-600"
            />
            <button
              onClick={handleUpload}
              className="mt-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm transition"
            >
              {profilePic ? "Güncelle" : "Yükle"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}