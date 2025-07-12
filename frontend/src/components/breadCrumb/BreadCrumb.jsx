// src/components/BreadCrumb.jsx
import React from "react";
import { Link } from "react-router-dom";

const BreadCrumb = () => (
  <div className="bg-gray-100 py-3">
    <div className="container mx-auto px-4 text-sm text-gray-600">
      <Link to="/" className="hover:underline">
        Home
      </Link>
      <span className="mx-2">/</span>
      <span className="font-medium text-gray-800">Shop</span>
    </div>
  </div>
);

export default BreadCrumb;
