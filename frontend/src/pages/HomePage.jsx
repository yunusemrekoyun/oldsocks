import React from "react";
import Hero from "../components/hero/Hero";
import Categories from "../components/categories/Categories";
import SecondHero from "../components/hero/SecondHero"; // İkinci hero bileşenini ekle
import Campaigns from "../components/campaigns/Campaigns";
import Services from "../components/services/Services";
import HomeProductSection from "../components/products/HomeProductSection";

const HomePage = () => (
  <>
    <Hero />
    <Categories />
    <HomeProductSection sectionKey="new" />
    <HomeProductSection sectionKey="featured" />
    <SecondHero />
    <HomeProductSection sectionKey="popular" />
    <Campaigns />
    <Services />
  </>
);

export default HomePage;
