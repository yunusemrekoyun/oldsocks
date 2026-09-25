// src/components/SecondHero.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // ← import ettik
import publicApi from "../../../publicApi";
import { getResponsiveImageProps } from "../../utils/media";

export default function SecondHero() {
  const [campaign, setCampaign] = useState(null);
  const navigate = useNavigate(); // ← navigate hook

  useEffect(() => {
    publicApi
      .get("/campaigns/active")
      .then(({ data }) => setCampaign(data))
      .catch((err) => console.error("Aktif kampanya alınamadı:", err));
  }, []);

  if (!campaign) return null;

  const { title, subtitle, buttonText, imageUrl, items } = campaign;
  const imageProps = getResponsiveImageProps(campaign.media || imageUrl, {
    widths: [640, 960, 1280, 1600, 1920],
    defaultWidth: 1280,
    sizes: "100vw",
  });

  const handleClick = () => {
    // 2) /shop sayfasına yönlendir, state ile aktar
    navigate("/shop", {
      state: {
        campaignItems: items,
        campaignTitle: title || "Kampanya",
      },
    });
  };

  return (
    <section className="relative w-full">
      {/* Arka plan */}
      <div className="w-full h-[60vh] md:h-[70vh] lg:h-[80vh] overflow-hidden">
        <img
          src={imageProps.src}
          srcSet={imageProps.srcSet}
          sizes={imageProps.sizes}
          alt={title || "Kampanya görseli"}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
        />
      </div>

      {/* İçerik */}
      <div className="absolute inset-0 flex flex-col items-center justify-end text-center px-6 pb-8 md:pb-12">
        {(title || subtitle) && (
          <div className="max-w-4xl bg-dark1/85 px-5 py-3 text-white">
            {title && <h2 className="font-playfair text-2xl font-bold uppercase leading-tight md:text-4xl">{title}</h2>}
            {subtitle && <p className="mt-1 text-sm md:text-lg">{subtitle}</p>}
          </div>
        )}
        <button
          onClick={handleClick}
          className="mt-3 rounded-full bg-dark1 px-8 py-3 font-medium text-white transition-colors duration-200 hover:bg-dark2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {buttonText}
        </button>
      </div>
    </section>
  );
}
