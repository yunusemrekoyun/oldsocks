import React from "react";
import Hero from "../components/hero/Hero";
import Categories from "../components/categories/Categories";
import SecondHero from "../components/hero/SecondHero"; // İkinci hero bileşenini ekle
import Campaigns from "../components/campaigns/Campaigns";
import Services from "../components/services/Services";
import HomeProductSection from "../components/products/HomeProductSection";
import { normalizeSectionOrder, useStorefrontSettings } from "../context/storefrontSettings";

const HomePage = () => {
  const { sectionOrder } = useStorefrontSettings();
  const order = normalizeSectionOrder(sectionOrder);

  return <>
    <Hero />
    <Categories />
    <HomeProductSection sectionKey={order[0]} />
    <HomeProductSection sectionKey={order[1]} />
    <SecondHero />
    <HomeProductSection sectionKey={order[2]} />
    <Campaigns />
    <Services />
  </>;
};

export default HomePage;
