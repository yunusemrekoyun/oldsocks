// src/pages/AboutPage.jsx
import React from "react";
import BreadCrumb from "../components/breadCrumb/BreadCrumb";
import OurVision from "../components/about/OurVision";
import OurMission from "../components/about/OurMission";
import History from "../components/about/History";
import Categories from "../components/categories/Categories";
import Services from "../components/services/Services";
const AboutPage = () => (
  <>
    <BreadCrumb />
    <OurVision />
    <OurMission />
    <History />
    <Categories />
    <Services />
  </>
);

export default AboutPage;
