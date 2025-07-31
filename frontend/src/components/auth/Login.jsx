import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import api from "../../../api";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

const Login = ({ onSwitch }) => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setIsLoggedIn } = useContext(AuthContext);
  const navigate = useNavigate();

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
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-md mx-auto bg-white border border-light2 rounded-2xl shadow-lg p-8 text-dark1"
    >
      <h2 className="text-3xl font-bold text-center mb-6">Giriş Yap</h2>

      {success && (
        <div className="text-green-600 text-sm text-center mb-4">
          Başarıyla giriş yaptınız!
        </div>
      )}
      {error && (
        <div className="text-red-600 text-sm text-center mb-4">
          Hata: {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm mb-1 text-dark2">
            E-posta adresi
          </label>
          <input
            id="email"
            type="email"
            name="email"
            placeholder="ornek@mail.com"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-lg border border-light2 bg-light1 text-dark1 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-dark1 transition"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm mb-1 text-dark2">
            Şifre
          </label>
          <input
            id="password"
            type="password"
            name="password"
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-lg border border-light2 bg-light1 text-dark1 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-dark1 transition"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg bg-dark1 text-white font-semibold hover:bg-dark2 transition disabled:opacity-50"
        >
          {loading ? "Giriş Yapılıyor…" : "Giriş Yap"}
        </button>
      </form>

      <p className="text-sm text-center mt-6 text-dark2">
        Hesabınız yok mu?{" "}
        <button
          onClick={onSwitch}
          className="text-dark1 font-semibold hover:underline"
        >
          Kayıt olun
        </button>
      </p>
    </motion.div>
  );
};

export default Login;
