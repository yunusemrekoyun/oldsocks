import React, { useState } from "react";

import api from "../../../api";
// eslint-disable-next-line no-unused-vars
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
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await api.post("/auth/register", formData);
      if (res.status === 201) {
        setSuccess(true);
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          phone: "",
        });

        // İsteğe göre otomatik geçiş:
        // setTimeout(() => navigate("/profile"), 1500);
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
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-md mx-auto bg-white border border-light2 rounded-2xl shadow-lg p-8 text-dark1"
    >
      <h2 className="text-3xl font-bold text-center mb-6">Kayıt Ol</h2>

      {error && (
        <div className="text-red-600 text-sm text-center mb-4">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Form alanları */}
        {["firstName", "lastName", "email", "password", "phone"].map(
          (field, i) => {
            const labels = {
              firstName: "Adınız",
              lastName: "Soyadınız",
              email: "E-posta",
              password: "Şifre",
              phone: "Telefon (örneğin: +905xx...)",
            };
            const types = {
              email: "email",
              password: "password",
              phone: "text",
            };

            return (
              <div key={i}>
                <label
                  htmlFor={field}
                  className="block text-sm mb-1 text-dark2"
                >
                  {labels[field]}
                </label>
                <input
                  id={field}
                  name={field}
                  type={types[field] || "text"}
                  placeholder={labels[field]}
                  value={formData[field]}
                  onChange={handleChange}
                  required={field !== "phone"}
                  className="w-full px-4 py-3 rounded-lg border border-light2 bg-light1 text-dark1 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-dark1 transition"
                />
              </div>
            );
          }
        )}

        {success ? (
          <div className="w-full text-center text-sm font-semibold text-green-600 bg-green-50 border border-green-200 rounded-lg py-3 px-4">
            Kaydınız başarıyla oluşturuldu. Giriş yapabilirsiniz.
          </div>
        ) : (
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-dark1 text-white font-semibold hover:bg-dark2 transition disabled:opacity-50"
          >
            {loading ? "Kaydediliyor..." : "Kayıt Ol"}
          </button>
        )}
      </form>

      <p className="text-sm text-center mt-6 text-dark2">
        Zaten bir hesabınız var mı?{" "}
        <button
          onClick={onSwitch}
          className="text-dark1 font-semibold hover:underline"
        >
          Giriş Yapın
        </button>
      </p>
    </motion.div>
  );
};

export default Register;
