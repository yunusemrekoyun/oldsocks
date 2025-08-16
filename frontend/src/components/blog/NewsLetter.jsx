import React, { useState } from "react";
import api from "../../../api";

const NewsLetter = () => {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { type: "success" | "error", text: string }

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);

    const clean = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(clean)) {
      setMsg({ type: "error", text: "Geçerli bir e-posta girin." });
      return;
    }

    setBusy(true);
    try {
      await api.post("/newsletter/subscribe", { email: clean });
      setMsg({ type: "success", text: "Abonelik kaydedildi. Teşekkürler!" });
      setEmail("");
    } catch (err) {
      setMsg({
        type: "error",
        text: err?.response?.data?.message || "Bir hata oluştu.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-[#f4f4f4] p-6 rounded-lg shadow-sm text-center">
      <h4 className="text-xl font-[Playfair] tracking-wide text-[#0b0b0d] mb-6 border-b border-[#d9d9d9] pb-3">
        Bültenimize Abone Ol
      </h4>

      <form className="space-y-4" onSubmit={onSubmit}>
        <input
          type="email"
          placeholder="E-posta adresinizi girin"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-5 py-4 border border-[#d9d9d9] bg-white text-[#333] text-base rounded focus:outline-none focus:ring-2 focus:ring-[#125795] placeholder-gray-500"
          disabled={busy}
          required
        />
        <button
          type="submit"
          disabled={busy}
          className="w-full py-4 bg-dark2 text-white text-sm font-medium uppercase tracking-wider rounded hover:bg-[#0b0b0d] transition disabled:opacity-60"
        >
          {busy ? "Gönderiliyor..." : "Abone Ol"}
        </button>
      </form>

      {msg && (
        <p
          className={`mt-3 text-sm ${
            msg.type === "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          {msg.text}
        </p>
      )}
    </div>
  );
};

export default NewsLetter;
