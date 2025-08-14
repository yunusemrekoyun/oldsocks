// src/pages/HomePage.jsx
import React from "react";
import Hero from "../components/hero/Hero";
import Categories from "../components/categories/Categories";
import ProductGrid from "../components/products/ProductGrid"; // Ürün ızgarası bileşeni
import SecondHero from "../components/hero/SecondHero"; // İkinci hero bileşenini ekle
import Campaigns from "../components/campaigns/Campaigns";
import Services from "../components/services/Services";
import NewProducts from "../components/products/NewProducts"; 
const HomePage = () => (
  <>
    <Hero />
     <NewProducts />
    <Categories />

    <ProductGrid />
    
    <SecondHero />
    <ProductGrid />

    <Campaigns />
    <Services />
  </>
);

export default HomePage;
