// src/components/Campaigns.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CampaignItem from "./CampaignItem";
import api from "../../../api";

export default function Campaigns() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/mini-campaigns")
      .then(({ data }) => setSlots(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSlotClick = async (slot) => {
    try {
      const { data } = await api.get(`/mini-campaigns/active?slot=${slot}`);
      console.log(`Slot ${slot} ürünleri:`, data.items);
      // ShopPage'e yönlendir:
      navigate("/shop", {
        state: {
          miniCampaignItems: data.items,
          miniCampaignTitle: data.title,
        },
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="py-10 text-center">Yükleniyor…</div>;

  const slot1 = slots.find((c) => c.slot === 1);
  const slot2 = slots.find((c) => c.slot === 2);

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[slot1, slot2].map(
          (c) =>
            c && (
              <CampaignItem
                key={c._id}
                image={c.imageUrl}
                title={c.title}
                onClick={() => handleSlotClick(c.slot)}
              />
            )
        )}
      </div>
    </section>
  );
}
