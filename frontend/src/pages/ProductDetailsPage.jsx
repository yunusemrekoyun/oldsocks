// src/pages/ProductDetailsPage.jsx
import React from "react";
import BreadCrumb from "../components/breadCrumb/BreadCrumb";
import ProductDetails from "../components/products/product-details/ProductDetails";
import ProductMiniMap from "../components/products/product-details/ProductMiniMap";
import AddToCart from "../components/products/product-details/AddToCart";
import Campaigns from "../components/campaigns/Campaigns";
import Services from "../components/services/Services";

const ProductDetailsPage = () => (
  <>
    <BreadCrumb />

    <main className="container mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left two-thirds: details */}
      <section className="lg:col-span-2">
        <ProductDetails />
      </section>

      {/* Right one-third: map + add to cart */}
      <aside className="lg:col-span-1">
        <ProductMiniMap />
        <AddToCart />
      </aside>
    </main>

    {/* Followed by campaigns & services */}
    <Campaigns />
    <Services />
  </>
);

export default ProductDetailsPage;
