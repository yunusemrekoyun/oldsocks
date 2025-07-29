// src/components/auth/Login.jsx
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api";
import { AuthContext } from "../../context/AuthContext";
import { motion } from "framer-motion";

const Login = ({ onSwitch }) => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setIsLoggedIn } = useContext(AuthContext);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const { data } = await api.post("/auth/login", form);
      localStorage.setItem("accessToken", data.accessToken);
      setIsLoggedIn(true);
      setSuccess(true);
      setForm({ email: "", password: "" });

      setTimeout(() => navigate("/profile"), 1000);
    } catch (err) {
      setError(err.response?.data?.message || "Giriş başarısız");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 text-dark1"
    >
      <h2 className="text-3xl font-bold text-center">Giriş Yap</h2>

      {success && (
        <div className="text-green-600 text-center">Başarıyla giriş yaptınız!</div>
      )}
      {error && (
        <div className="text-red-600 text-center">Hata: {error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          name="email"
          placeholder="E-posta adresiniz"
          value={form.email}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring focus:ring-blue-200 focus:outline-none"
        />
        <input
          type="password"
          name="password"
          placeholder="Şifreniz"
          value={form.password}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring focus:ring-blue-200 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "Giriş Yapılıyor…" : "Giriş Yap"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-600">
        Hesabınız yok mu?{" "}
        <button
          onClick={onSwitch}
          className="text-blue-600 font-semibold hover:underline"
        >
          Kayıt olun
        </button>
      </p>
    </motion.div>
  );
};

export default Login;