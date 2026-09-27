import React, { useState } from "react";
import { IMaskInput } from "react-imask";
import api from "../../../api";

const digitsOf = (value) => String(value || "").replace(/\D/g, "").slice(-10);

// Profilde telefon görüntüleme ve düzenleme (kargo ve ödeme için gerekli).
export default function PhoneField({ phone, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(digitsOf(phone));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const digits = digitsOf(value);
    if (digits.length !== 10 || digits[0] !== "5") {
      setError("5 ile başlayan 10 haneli cep telefonu girin.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const { data } = await api.put("/users/me", { phone: `+90${digits}` });
      onSaved?.(data?.phone || `+90${digits}`);
      setEditing(false);
    } catch (err) {
      setError(err?.response?.data?.message || "Telefon kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <div className="flex items-center justify-between gap-3 bg-light1 p-3 rounded-lg border border-light2">
        <span>{phone || "-"}</span>
        <button
          type="button"
          onClick={() => {
            setValue(digitsOf(phone));
            setEditing(true);
          }}
          className="text-sm font-medium text-dark1 underline underline-offset-2"
        >
          {phone ? "Değiştir" : "Ekle"}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center overflow-hidden rounded-lg border border-light2 bg-white">
        <span className="px-3 py-2 bg-light1 text-dark2 border-r border-light2">+90</span>
        <IMaskInput
          id="profile-phone"
          aria-label="Cep telefonu"
          mask="500 000 00 00"
          definitions={{ 0: /[0-9]/ }}
          value={value}
          onAccept={(next) => setValue(next)}
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="5__ ___ __ __"
          className="w-full px-3 py-2 outline-none"
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-dark1 px-3 py-1.5 text-sm text-white hover:bg-dark2 disabled:opacity-60"
        >
          {saving ? "Kaydediliyor…" : "Kaydet"}
        </button>
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setError("");
          }}
          className="rounded-lg border border-light2 px-3 py-1.5 text-sm text-dark1 hover:bg-light1"
        >
          Vazgeç
        </button>
      </div>
    </div>
  );
}
