// src/pages/ShopPage.jsx
import React from "react";
import BreadCrumb from "../components/breadCrumb/BreadCrumb";
import CategoryFilter from "../components/categories/CategoryFilter";
import Products from "../components/products/Products";
import Categories from "../components/categories/Categories";

const ShopPage = () => (
  <div className="bg-white text-dark1">
    <BreadCrumb />

    <main className="container mx-auto px-4 py-14 grid grid-cols-1 lg:grid-cols-4 gap-10">
      {/* Filtre Alanı */}
      <aside className="lg:col-span-1 bg-light1 rounded-xl p-6 shadow-sm">
        <CategoryFilter />
      </aside>

      {/* Ürünler Alanı */}
      <section className="lg:col-span-3">
        <header className="mb-6">
          <h1 className="text-4xl font-playfair font-bold tracking-wide text-black">
            Shop with us
          </h1>
          <p className="text-dark2 text-sm mt-1">
            Browse from 230 latest items
          </p>
        </header>

        <Products />

        <div className="mt-10 text-center">
          <button className="px-6 py-2 border border-dark1 text-dark1 rounded-full hover:bg-dark1 hover:text-white transition duration-200">
            Browse More
          </button>
        </div>
      </section>
    </main>

    <Categories />
  </div>
);

export default ShopPage;
