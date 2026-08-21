// src/components/Services.jsx
import React, { useEffect, useState } from "react";
import { FaShippingFast, FaShieldAlt, FaHeadset } from "react-icons/fa";
import api from "../../../api";
import { formatTry } from "../../utils/currency";

const baseServices = [
  {
    id: 1,
    icon: <FaShippingFast className="h-9 w-9 text-primary" />,
    title: "Hızlı Kargo",
    subtitle: "Siparişleriniz en kısa sürede kapınızda",
  },
  {
    id: 2,
    icon: <FaShieldAlt className="h-9 w-9 text-primary" />,
    title: "Güvenli Alışveriş",
    subtitle: "Tüm işlemleriniz %100 güvence altında",
  },
  {
    id: 3,
    icon: <FaHeadset className="h-9 w-9 text-primary" />,
    title: "Güvenilir Destek",
    subtitle: "Satış öncesi ve sonrası yanınızdayız",
  },
];

const Services = () => {
  const [services, setServices] = useState(baseServices);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await api.get("/shipping");
        if (!alive) return;
        const list = Array.isArray(data) ? data : [];

        // sadece ilk kargo methodunu baz alalım
        const method = list[0];
        if (method?.freeShippingThreshold != null) {
          setServices([
            {
              id: "free-shipping",
              icon: <FaShippingFast className="h-9 w-9 text-primary" />,
              title: `${method.name}`,
              subtitle: `${formatTry(method.freeShippingThreshold, {
                fractionDigits: 0,
              })} üzeri alışverişlerde kargo ücretsiz`,
            },
            ...baseServices.filter((s) => s.id !== 1), // mevcut "Hızlı Kargo" yerine bunu koy
          ]);
        } else {
          setServices(baseServices);
        }
      } catch (e) {
        console.error("services shipping error:", e);
        setServices(baseServices);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section className="bg-light1 py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map(({ id, icon, title, subtitle }) => (
            <div
              key={id}
              className="group bg-white border border-light2 rounded-xl p-8 flex flex-col items-center text-center shadow-md hover:shadow-xl transition-all duration-300 hover:border-primary hover:bg-light1"
            >
              <div className="mb-5 transform group-hover:scale-110 transition-transform duration-300">
                {icon}
              </div>
              <h4 className="text-lg font-semibold text-dark1 group-hover:text-primary">
                {title}
              </h4>
              <p className="text-sm text-dark2 mt-2 leading-relaxed">
                {subtitle}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
