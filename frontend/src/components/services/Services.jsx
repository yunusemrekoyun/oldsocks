// src/components/Services.jsx
import React from "react";
import {
  FaShippingFast,
  FaHeadset,
  FaCreditCard,
  FaUndoAlt,
} from "react-icons/fa";

const services = [
  {
    id: 1,
    icon: <FaShippingFast className="h-8 w-8 text-primary" />,
    title: "Hızlı ve Ücretsiz Teslimat",
    subtitle: "Tüm siparişlerde ücretsiz kargo",
  },
  {
    id: 2,
    icon: <FaHeadset className="h-8 w-8 text-primary" />,
    title: "7/24 Destek",
    subtitle: "Her zaman buradayız",
  },
  {
    id: 3,
    icon: <FaCreditCard className="h-8 w-8 text-primary" />,
    title: "Güvenli Ödeme",
    subtitle: "%100 güvenli ödeme altyapısı",
  },
  {
    id: 4,
    icon: <FaUndoAlt className="h-8 w-8 text-primary" />,
    title: "Kolay İade",
    subtitle: "30 gün içinde iade garantisi",
  },
];

const Services = () => (
  <section className="bg-light1 py-16">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {services.map(({ id, icon, title, subtitle }) => (
          <div
            key={id}
            className="group bg-white border border-light2 rounded-xl p-6 flex flex-col items-center text-center shadow-sm hover:shadow-lg transition-shadow duration-300 hover:border-primary hover:bg-light1"
          >
            <div className="mb-4 transform group-hover:scale-110 transition-transform duration-300">
              {icon}
            </div>
            <h4 className="text-lg font-semibold text-dark1 group-hover:text-primary">
              {title}
            </h4>
            <p className="text-sm text-dark2 mt-1">{subtitle}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Services;
