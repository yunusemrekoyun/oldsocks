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
    icon: <FaShippingFast className="h-8 w-8" />,
    title: "Fast & Free Delivery",
    subtitle: "Free delivery on all orders",
  },
  {
    id: 2,
    icon: <FaHeadset className="h-8 w-8" />,
    title: "24/7 Support",
    subtitle: "We are here to help",
  },
  {
    id: 3,
    icon: <FaCreditCard className="h-8 w-8" />,
    title: "Secure Payment",
    subtitle: "100% secure payment",
  },
  {
    id: 4,
    icon: <FaUndoAlt className="h-8 w-8" />,
    title: "Easy Returns",
    subtitle: "30-days return policy",
  },
];

const Services = () => (
  <section className="bg-light2 py-12">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
        {services.map(({ id, icon, title, subtitle }) => (
          <div key={id} className="flex flex-col items-center space-y-3">
            <div className="text-dark2">{icon}</div>
            <h4 className="text-lg font-medium text-dark3">{title}</h4>
            <p className="text-sm text-dark2">{subtitle}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Services;
