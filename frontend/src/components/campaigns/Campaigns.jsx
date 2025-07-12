// src/components/Campaigns.jsx
import React from "react";
import CampaignItem from "./CampaignItem";

// Görselleri src/assets/ altına ekleyin:
import camp1 from "../../assets/campaigns/campaign1.png";
import camp2 from "../../assets/campaigns/campaign2.png";

const campaigns = [
  {
    id: 1,
    image: camp1,
    title: "Established fact that by the readable content",
  },
  {
    id: 2,
    image: camp2,
    title: "Established fact that by the readable content",
  },
];

const Campaigns = () => (
  <section className="container mx-auto px-4 py-12">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {campaigns.map(({ id, image, title }) => (
        <CampaignItem
          key={id}
          image={image}
          title={title}
          onClick={() => {
            /* tıklanınca ilgili sayfaya yönlendirme ekleyebilirsiniz */
          }}
        />
      ))}
    </div>
  </section>
);

export default Campaigns;
