import React from "react";
import Header from "./Header";
import Footer from "./Footer";
import WhatsAppButton from "../ui/WhatsappButton";
import AnnouncementBar from "../AnnouncementBar";
import CookieConsent from "../privacy/CookieConsent";

const Layout = ({ children }) => (
  <div className="flex flex-col min-h-screen">
    <AnnouncementBar /> {/* ⬅️ siyah bant (enabled değilse hiç render etmez) */}
    <Header />
    <main className="flex-grow">{children}</main>
    <Footer />
    <WhatsAppButton />
    <CookieConsent />
  </div>
);

export default Layout;
