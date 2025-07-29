// src/components/auth/Register.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api";
import { motion } from "framer-motion";

const Register = ({ onSwitch }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/register", formData);
      if (res.status === 201) {
        localStorage.setItem("accessToken", res.data.accessToken);
        navigate("/profile");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Kayıt sırasında bir hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 text-dark1"
    >
      <h2 className="text-3xl font-bold text-center">Kayıt Ol</h2>

      {error && (
        <div className="text-red-600 text-center text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="firstName"
          placeholder="Adınız"
          value={formData.firstName}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring focus:ring-blue-200 focus:outline-none"
        />
        <input
          name="lastName"
          placeholder="Soyadınız"
          value={formData.lastName}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring focus:ring-blue-200 focus:outline-none"
        />
        <input
          type="email"
          name="email"
          placeholder="E-posta"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring focus:ring-blue-200 focus:outline-none"
        />
        <input
          type="password"
          name="password"
          placeholder="Şifre"
          value={formData.password}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring focus:ring-blue-200 focus:outline-none"
        />
        <input
          name="phone"
          placeholder="Telefon (+90 ile)"
          value={formData.phone}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring focus:ring-blue-200 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "Kaydediliyor..." : "Kayıt Ol"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-600">
        Zaten bir hesabınız var mı?{" "}
        <button
          onClick={onSwitch}
          className="text-blue-600 font-semibold hover:underline"
        >
          Giriş Yapın
        </button>
      </p>
    </motion.div>
  );
};

export default Register;