import React, { useEffect, useState } from "react";
import publicApi from "../../../publicApi";
import { defaultStorefrontSettings, StorefrontSettingsContext } from "../../context/storefrontSettings";
import { SiteContentContext } from "../../context/siteContent";
import Header from "./Header";
import Footer from "./Footer";
import WhatsAppButton from "../ui/WhatsAppButton";
import AnnouncementBar from "../AnnouncementBar";
import CookieConsent from "../privacy/CookieConsent";
import { useLocation } from "react-router-dom";
import MobileNavigation from "./MobileNavigation";

const Layout = ({ children }) => {
  const { pathname } = useLocation();
  const [settings, setSettings] = useState(defaultStorefrontSettings);
  const [siteContent, setSiteContent] = useState(null);
  const [headerCampaigns, setHeaderCampaigns] = useState([]);

  useEffect(() => {
    let active = true;
    publicApi.get("/cart-campaigns/header")
      .then(({ data }) => { if (active) setHeaderCampaigns(Array.isArray(data) ? data : []); })
      .catch(() => { /* Kampanyalar alınamazsa kategori ve mağaza bağlantıları kalır. */ });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    publicApi.get("/storefront")
      .then(({ data }) => { if (active) setSettings(data); })
      .catch(() => { /* Varsayılan vitrin ayarları geçerli kalır. */ });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    publicApi.get("/site-content")
      .then(({ data }) => { if (active) setSiteContent(data); })
      .catch(() => { /* Kod içindeki varsayılan içerikler gösterilir. */ });
    return () => { active = false; };
  }, []);

  return (
    <StorefrontSettingsContext.Provider value={settings}>
      <SiteContentContext.Provider value={siteContent}>
      <div className={`storefront-theme storefront-font-${settings.fontPreset} ${pathname === "/payment" ? "" : "has-mobile-navigation"} flex flex-col min-h-screen`}>
        <AnnouncementBar />
        <Header headerCampaigns={headerCampaigns} />
        <main className="flex-grow">{children}</main>
        <Footer />
        <MobileNavigation headerCampaigns={headerCampaigns} />
        <WhatsAppButton />
        <CookieConsent />
      </div>
      </SiteContentContext.Provider>
    </StorefrontSettingsContext.Provider>
  );
};

export default Layout;
