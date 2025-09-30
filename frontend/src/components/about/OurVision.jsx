// src/components/about/OurVision.jsx
import React from "react";
import storyImg from "../../assets/about/vision.png";

const OurVision = () => (
  <section className="bg-light1 py-20 px-4">
    <div className="container mx-auto">
      <h2 className="text-4xl font-serif font-bold text-dark1 text-center mb-6">
        Vizyonumuz
      </h2>
      <p className="text-center text-dark2 max-w-2xl mx-auto mb-10 leading-relaxed">
        Oldsocks olarak amacımız; Kütahya’dan doğan sokak kültürü ve casual
        şıklığı, yüksek kalite ve özgün tasarımla birleştirip Türkiye’nin her
        yerine ulaştırmak. Erkek giyimde trendleri sadece takip eden değil, aynı
        zamanda belirleyen; zamansız, rahat ve karakterli bir stil anlayışını
        yaygınlaştıran ilham verici bir marka olmak.
      </p>
      <div className="overflow-hidden rounded-xl shadow-lg">
        <img
          src={storyImg}
          alt="Oldsocks Vizyon"
          className="w-full h-[600px] object-cover object-center"
        />
      </div>
    </div>
  </section>
);

export default OurVision;
