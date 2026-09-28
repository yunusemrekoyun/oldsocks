import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api";
import { AuthContext } from "../../context/AuthContext";
import { clearCheckout } from "../../utils/checkoutSession";

// KVKK: müşteri hesabını ve hesaba bağlı kişisel verilerini kendisi silebilir.
export default function DeleteAccountForm() {
  const navigate = useNavigate();
  const { setIsLoggedIn } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!confirm) {
      setError("Onay kutusunu işaretleyin.");
      return;
    }
    setLoading(true);
    try {
      await api.delete("/users/me", { data: { password, confirm: true }, skipAuthRefresh: true });
      localStorage.removeItem("accessToken");
      clearCheckout();
      setIsLoggedIn(false);
      navigate("/", { replace: true, state: { accountDeleted: true } });
    } catch (err) {
      setError(err?.response?.data?.message || "Hesap silinemedi. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-8 rounded-2xl border border-red-200 bg-white p-6">
      <h3 className="text-lg font-semibold text-dark1">Hesabı sil</h3>
      <p className="mt-1 text-sm text-dark2">
        Hesabınız, adresleriniz, profil fotoğrafınız, yorumlarınız ve bülten kaydınız silinir.
        Verdiğiniz siparişlerin kayıtları yasal saklama süresi boyunca tutulur. Bu işlem geri alınamaz.
      </p>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
        >
          Hesabımı silmek istiyorum
        </button>
      ) : (
        <form onSubmit={submit} className="mt-4 space-y-3">
          <div>
            <label htmlFor="delete-password" className="mb-1 block text-sm text-dark2">
              Şifreniz
            </label>
            <input
              id="delete-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-light2 bg-light1 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} />
            <span>Hesabımın ve kişisel verilerimin kalıcı olarak silineceğini anladım.</span>
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
            >
              {loading ? "Siliniyor…" : "Hesabımı kalıcı olarak sil"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setPassword("");
                setConfirm(false);
                setError("");
              }}
              className="rounded-lg border border-light2 px-4 py-2 text-sm text-dark1 hover:bg-light1"
            >
              Vazgeç
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
