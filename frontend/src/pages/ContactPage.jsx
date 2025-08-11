import React from "react";
import { FaHome, FaPhoneAlt, FaEnvelope } from "react-icons/fa";
import BreadCrumb from "../components/breadCrumb/BreadCrumb";
import Map from "../components/about/Map";
import ContactInput from "../components/contact/ContactInput";
import ContactInfo from "../components/contact/ContactInfo";

const ContactPage = () => (
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
          <form className="space-y-6">
            {/* Message */}
            <ContactInput multiline placeholder=" Mesajınızı Girin" />

            {/* Name & Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ContactInput placeholder="Adınızı Girin" />
              <ContactInput placeholder="E-mail" />
            </div>

            {/* Subject */}
            <ContactInput placeholder="Başlık" />

            {/* Send Button */}
            <button
              type="submit"
              className="px-8 py-3 border border-dark1 text-dark1 rounded-lg hover:bg-dark1 hover:text-white transition"
            >
              Gönder
            </button>
          </form>
        </div>

        {/* Right: Contact Info */}
        <aside className="space-y-6">
          <ContactInfo
            Icon={FaHome}
            title="Kütahya, Merkez"
            subtitle="Adres Bilgisi"
          />
          <ContactInfo
            Icon={FaPhoneAlt}
            title="+1 253 565 2365"
            subtitle="Pazartesi-Cumartesi 09:00-20:00"
          />
          <ContactInfo
            Icon={FaEnvelope}
            title="support@oldsocks.com"
            subtitle="Dilediğiniz zaman bize ulaşabilirsiniz"
          />
        </aside>
      </section>
    </main>
  </>
);

export default ContactPage;
