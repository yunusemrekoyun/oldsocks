// src/components/about/OurMission.jsx
import React from "react";
import missionImg from "../../assets/about/mission.png";

const OurMission = () => (
  <section className="py-20 px-4">
    <div className="container mx-auto">
      <h2 className="text-4xl font-serif font-bold text-dark1 text-center mb-6">
        Misyonumuz
      </h2>
      <p className="text-center text-dark2 max-w-2xl mx-auto mb-10 leading-relaxed">
        Günlük hayatta giyilebilir sokak stilini; iyi kalıp, kaliteli kumaş ve
        özenli işçilikle herkes için ulaşılabilir kılmak. Koleksiyonlarımızı
        zamansız parçalar etrafında kurgularken, müşterimize sadece kıyafet
        değil, tarz ve özgüven deneyimi sunmak. Kütahya’dan büyüyen yerel
        enerjimizi koruyup, dürüst fiyat politikası ve tutarlı kalite ile ulusal
        çapta sürdürülebilir bir marka kültürü inşa etmek.
      </p>
      <div className="overflow-hidden rounded-xl shadow-lg">
        <img
          src={missionImg}
          alt="Oldsocks Misyon"
          className="w-full h-auto object-cover"
        />
      </div>
    </div>
  </section>
);

export default OurMission;
