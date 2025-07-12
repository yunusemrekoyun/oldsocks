// src/pages/HomePage.jsx
import React from "react";
import Hero from "../components/hero/Hero";
import Categories from "../components/categories/Categories";
import ProductGrid from "../components/products/ProductGrid"; // Ürün ızgarası bileşeni
import SecondHero from "../components/hero/SecondHero"; // İkinci hero bileşenini ekle
import Campaigns from "../components/campaigns/Campaigns";
import Services from "../components/services/Services";
const HomePage = () => (
  <>
    <Hero />
    <Categories />
    <ProductGrid />
    <SecondHero />
    <Campaigns />
    <Services />
    {/* Buraya alt bölümler (New Arrival, Collection vs.) gelecek */}
  </>
);

export default HomePage;
