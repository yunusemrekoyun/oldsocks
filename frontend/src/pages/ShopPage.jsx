// src/pages/ShopPage.jsx
import React from "react";
import BreadCrumb from "../components/breadCrumb/BreadCrumb";
import CategoryFilter from "../components/categories/CategoryFilter";
import Products from "../components/products/Products";
import Categories from "../components/categories/Categories";
const ShopPage = () => (
  <>
    <BreadCrumb />

    <main className="container mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* 1-sütun filtre */}
      <aside className="lg:col-span-1">
        <CategoryFilter />
      </aside>

      {/* 3-sütun ürünler */}
      <section className="lg:col-span-3">
        <h1 className="text-4xl font-serif font-bold text-gray-900">
          Shop with us
        </h1>
        <p className="text-gray-600 mt-2">Browse from 230 latest items</p>

        <Products />

        <div className="mt-10 text-center">
          <button className="px-6 py-2 border border-purple-600 text-purple-600 rounded-full hover:bg-purple-600 hover:text-white transition">
            Browse More
          </button>
        </div>
      </section>
    </main>
    <Categories />

  </>
);

export default ShopPage;
