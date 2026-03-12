// src/pages/ContactPage.jsx
import React, { useState } from "react";
import { FaHome, FaPhoneAlt, FaEnvelope } from "react-icons/fa";
import BreadCrumb from "../components/breadCrumb/BreadCrumb";
import Map from "../components/about/Map";
import ContactInput from "../components/contact/ContactInput";
import ContactInfo from "../components/contact/ContactInfo";
import api from "../../api";

const ContactPage = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    website: "",
  });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null); // { type: "success"|"error", msg: string }

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setResult(null);
    try {
      await api.post("/contact", {
        name: form.name,
        email: form.email,
        subject: form.subject,
        message: form.message,
        website: form.website,
      });
      setResult({ type: "success", msg: "Mesajınız alınmıştır, teşekkürler." });
      setForm({ name: "", email: "", subject: "", message: "", website: "" });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "Mesaj gönderilirken bir hata oluştu. Lütfen tekrar deneyin.";
      setResult({ type: "error", msg });
    } finally {
      setSending(false);
    }
  };

  const address = "Alipaşa, Üçbey Sk. No:7, 43020 Kütahya Merkez/Kütahya";

  return (
    <>
      <BreadCrumb />

      <main className="container mx-auto px-4 py-16 space-y-12">
        {/* 1) Map */}
        <Map />

        {/* 2) Get in Touch + Form + Info */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Form */}
          <div>
            <h2 className="text-3xl font-playfair font-bold text-dark1 mb-6">
              Bizimle İletişime Geçin
            </h2>

            {result && (
              <div
                className={`mb-4 rounded-lg px-4 py-3 text-sm ${
                  result.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {result.msg}
              </div>
            )}

            <form className="space-y-6" onSubmit={onSubmit}>
              <div className="absolute left-[-5000px] top-auto h-px w-px overflow-hidden">
                <label htmlFor="contact-website">Website</label>
                <input
                  id="contact-website"
                  name="website"
                  type="text"
                  value={form.website}
                  onChange={onChange}
                  autoComplete="off"
                  tabIndex={-1}
                />
              </div>

              {/* Message */}
              <ContactInput
                multiline
                name="message"
                placeholder="Mesajınızı girin"
                value={form.message}
                onChange={onChange}
                required
                disabled={sending}
              />

              {/* Name & Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ContactInput
                  name="name"
                  placeholder="Adınız"
                  value={form.name}
                  onChange={onChange}
                  required
                  disabled={sending}
                />
                <ContactInput
                  name="email"
                  type="email"
                  placeholder="E-posta"
                  value={form.email}
                  onChange={onChange}
                  required
                  disabled={sending}
                />
              </div>

              {/* Subject */}
              <ContactInput
                name="subject"
                placeholder="Başlık"
                value={form.subject}
                onChange={onChange}
                required
                disabled={sending}
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={sending}
                className="px-8 py-3 border border-dark1 text-dark1 rounded-lg hover:bg-dark1 hover:text-white transition disabled:opacity-60"
              >
                {sending ? "Gönderiliyor..." : "Gönder"}
              </button>
            </form>
          </div>

          {/* Right: Contact Info */}
          <aside className="space-y-6">
            <ContactInfo
              Icon={FaHome}
              title={address}
              subtitle="Adres Bilgisi"
            />
            <ContactInfo
              Icon={FaPhoneAlt}
              title="+90 541 428 29 89"
              subtitle="Pazartesi-Cumartesi 09:00-20:00"
            />
            <ContactInfo
              Icon={FaEnvelope}
              title="oldscks@gmail.com"
              subtitle="Dilediğiniz zaman bize ulaşabilirsiniz"
            />
          </aside>
        </section>
      </main>
    </>
  );
};

export default ContactPage;
