// src/components/auth/Register.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api";

const Register = () => {
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
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md mt-10">
      <h2 className="text-2xl font-bold mb-4 text-center">Kayıt Ol</h2>
      {error && <div className="text-red-600 text-sm mb-4">Hata: {error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="firstName"
          placeholder="Adınız"
          value={formData.firstName}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border rounded"
        />
        <input
          name="lastName"
          placeholder="Soyadınız"
          value={formData.lastName}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border rounded"
        />
        <input
          type="email"
          name="email"
          placeholder="E-posta"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border rounded"
        />
        <input
          type="password"
          name="password"
          placeholder="Şifre"
          value={formData.password}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border rounded"
        />
        <input
          name="phone"
          placeholder="Telefon (+90 ile)"
          value={formData.phone}
          onChange={handleChange}
          className="w-full px-4 py-2 border rounded"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          {loading ? "Kaydediliyor..." : "Kayıt Ol"}
        </button>
      </form>
    </div>
  );
};

export default Register;
