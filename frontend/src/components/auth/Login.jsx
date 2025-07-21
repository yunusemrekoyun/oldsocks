// src/components/auth/Login.jsx
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api";
import { AuthContext } from "../../context/AuthContext";
const Login = () => {
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
      console.log("✅ Giriş başarılı:", data);
      localStorage.setItem("accessToken", data.accessToken);
      setIsLoggedIn(true);
      setSuccess(true);
      setForm({ email: "", password: "" });

      // 1 saniye bekleyip profile sayfasına yönlendir
      setTimeout(() => navigate("/profile"), 1000);
    } catch (err) {
      setError(err.response?.data?.message || "Giriş başarısız");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md mt-10">
      <h2 className="text-2xl font-bold mb-4 text-center">Giriş Yap</h2>

      {success && (
        <div className="text-green-600 text-center mb-4">
          Giriş başarılı! Yönlendiriliyorsunuz…
        </div>
      )}

      {error && (
        <div className="text-red-600 text-center mb-4">Hata: {error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          name="email"
          placeholder="E-posta"
          value={form.email}
          onChange={handleChange}
          required
          className={`w-full px-4 py-2 border rounded focus:outline-none ${
            error ? "border-red-500" : "border-gray-300"
          }`}
        />
        <input
          type="password"
          name="password"
          placeholder="Şifre"
          value={form.password}
          onChange={handleChange}
          required
          className={`w-full px-4 py-2 border rounded focus:outline-none ${
            error ? "border-red-500" : "border-gray-300"
          }`}
        />
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 rounded text-white transition ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Giriş Yapılıyor…" : "Giriş Yap"}
        </button>
      </form>
    </div>
  );
};

export default Login;
