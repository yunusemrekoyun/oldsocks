import React, { useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api";
import { AuthContext } from "../../context/AuthContext";
import { getPasswordValidation } from "../../utils/passwordRules";

export default function UserPasswordForm() {
  const navigate = useNavigate();
  const { setIsLoggedIn } = useContext(AuthContext);

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordValidation = useMemo(
    () => getPasswordValidation(form.newPassword || ""),
    [form.newPassword]
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.newPassword !== form.confirmPassword) {
      setError("Yeni şifre alanları eşleşmiyor.");
      return;
    }

    if (!passwordValidation.allOk) {
      setError("Yeni şifre güvenlik kurallarını sağlamıyor.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/users/me/password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });

      setSuccess(
        data?.message || "Şifreniz güncellendi. Lütfen tekrar giriş yapın."
      );
      setForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setTimeout(() => {
        localStorage.removeItem("accessToken");
        setIsLoggedIn(false);
        navigate("/auth", { replace: true });
      }, 900);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Şifre güncellenemedi. Lütfen tekrar deneyin."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-8 sm:mt-10 border-t border-light2 pt-6">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-lg sm:text-xl font-semibold text-dark1">
            Şifre Değiştir
          </h3>
          <p className="text-sm leading-6 text-dark2">
            Mevcut şifrenizi girin, ardından yeni şifrenizi belirleyin.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowPasswords((prev) => !prev)}
          className="self-start text-sm font-medium text-dark2 hover:text-dark1 hover:underline"
        >
          {showPasswords ? "Şifreleri gizle" : "Şifreleri göster"}
        </button>
      </div>

      {success && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <label
            htmlFor="currentPassword"
            className="mb-1 block text-sm font-semibold text-dark2"
          >
            Mevcut şifre
          </label>
          <input
            id="currentPassword"
            name="currentPassword"
            type={showPasswords ? "text" : "password"}
            value={form.currentPassword}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-light2 bg-light1 px-4 py-3 text-dark1 transition focus:outline-none focus:ring-2 focus:ring-dark1"
          />
        </div>

        <div>
          <label
            htmlFor="newPassword"
            className="mb-1 block text-sm font-semibold text-dark2"
          >
            Yeni şifre
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type={showPasswords ? "text" : "password"}
            value={form.newPassword}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-light2 bg-light1 px-4 py-3 text-dark1 transition focus:outline-none focus:ring-2 focus:ring-dark1"
          />
          <ul className="mt-2 space-y-1 text-xs">
            {passwordValidation.results.map((rule) => (
              <li
                key={rule.id}
                className={rule.ok ? "text-emerald-600" : "text-gray-500"}
              >
                {rule.ok ? "✓ " : "• "} {rule.label}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-1 block text-sm font-semibold text-dark2"
          >
            Yeni şifre (tekrar)
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showPasswords ? "text" : "password"}
            value={form.confirmPassword}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-light2 bg-light1 px-4 py-3 text-dark1 transition focus:outline-none focus:ring-2 focus:ring-dark1"
          />
        </div>

        <div className="lg:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-dark1 py-3 font-semibold text-white transition hover:bg-dark2 disabled:opacity-50 sm:w-auto sm:px-8"
          >
            {loading ? "Güncelleniyor..." : "Şifreyi Değiştir"}
          </button>
        </div>
      </form>
    </section>
  );
}
