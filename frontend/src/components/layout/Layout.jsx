import React, { useEffect, useState } from "react";
import publicApi from "../../../publicApi";
import { defaultStorefrontSettings, StorefrontSettingsContext } from "../../context/storefrontSettings";
import Header from "./Header";
import Footer from "./Footer";
import WhatsAppButton from "../ui/WhatsAppButton";
import AnnouncementBar from "../AnnouncementBar";
import CookieConsent from "../privacy/CookieConsent";

const Layout = ({ children }) => {
  const [settings, setSettings] = useState(defaultStorefrontSettings);

  useEffect(() => {
    let active = true;
    publicApi.get("/storefront")
      .then(({ data }) => { if (active) setSettings(data); })
      .catch(() => { /* Varsayılan vitrin ayarları geçerli kalır. */ });
    return () => { active = false; };
  }, []);

  return (
    <StorefrontSettingsContext.Provider value={settings}>
      <div className={`storefront-theme storefront-font-${settings.fontPreset} flex flex-col min-h-screen`}>
        <AnnouncementBar />
        <Header />
        <main className="flex-grow">{children}</main>
        <Footer />
        <WhatsAppButton />
        <CookieConsent />
      </div>
    </StorefrontSettingsContext.Provider>
  );
};

export default Layout;
