// src/components/SecondHero.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // ← import ettik
import api from "../../../api";

export default function SecondHero() {
  const [campaign, setCampaign] = useState(null);
  const navigate = useNavigate(); // ← navigate hook

  useEffect(() => {
    api
      .get("/campaigns/active")
      .then(({ data }) => setCampaign(data))
      .catch((err) => console.error("Aktif kampanya alınamadı:", err));
  }, []);

  if (!campaign) return null;

  const { title, subtitle, buttonText, imageUrl, items } = campaign;

  const handleClick = () => {
    // 1) Konsola bas
    console.log("Kampanyadaki ürünler:", items);
    // 2) /shop sayfasına yönlendir, state ile aktar
    navigate("/shop", {
      state: {
        campaignItems: items,
        campaignTitle: title,
      },
    });
  };

  return (
    <section className="relative w-full">
      {/* Arka plan */}
      <div className="w-full h-[60vh] md:h-[70vh] lg:h-[80vh] overflow-hidden">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Koyu overlay */}
      <div className="absolute inset-0 bg-dark1/70" />

      {/* İçerik */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
        <h2 className="text-3xl md:text-5xl lg:text-6xl font-playfair font-bold text-white uppercase leading-tight">
          {title}
        </h2>
        <p className="mt-3 text-lg md:text-2xl text-light2 tracking-wide">
          {subtitle}
        </p>
        <button
          onClick={handleClick}
          className="mt-6 px-8 py-3 bg-dark3 hover:bg-dark2 text-white font-medium rounded-full transition duration-300"
        >
          {buttonText}
        </button>
      </div>
    </section>
  );
}
