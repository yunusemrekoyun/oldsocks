// src/components/auth/Logout.jsx
import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FaSignOutAlt } from "react-icons/fa";
import api from "../../../api";
import { AuthContext } from "../../context/AuthContext";

const Logout = () => {
  const navigate = useNavigate();
  const { setIsLoggedIn } = useContext(AuthContext);

  const handleLogout = async () => {
    try {
      // Backend'de cookie’yi temizleyecek
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Logout hatası:", err);
    } finally {
      // Access token'ı de temizle
      localStorage.removeItem("accessToken");
      setIsLoggedIn(false);
      // Giriş sayfasına yönlendir
      navigate("/auth");
    }
  };

  return (
    <button
      onClick={handleLogout}
      title="Çıkış Yap"
      className="w-10 h-10 flex items-center justify-center border border-light3 rounded-full hover:border-brand transition"
    >
      <FaSignOutAlt className="text-dark2 hover:text-brand text-sm" />
    </button>
  );
};

export default Logout;
