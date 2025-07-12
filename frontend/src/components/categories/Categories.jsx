// src/components/Categories.jsx
import React from "react";
import CategoryItem from "./CategoryItem";
import cat1 from "../../assets/categories/cat1.png";
import cat2 from "../../assets/categories/cat2.png";
import cat3 from "../../assets/categories/cat3.png";
import cat4 from "../../assets/categories/cat4.png";

const categories = [
  { id: 1, image: cat1, alt: "Category 1" },
  { id: 2, image: cat2, alt: "Category 2" },
  { id: 3, image: cat3, alt: "Category 3" },
  { id: 4, image: cat4, alt: "Category 4" },
];

const Categories = () => (
  <section className="bg-light2 py-10">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        {categories.map((c) => (
          <CategoryItem
            key={c.id}
            image={c.image}
            alt={c.alt}
            onClick={() => {
              // TODO: Kategori sayfasına yönlendirme eklenecek
            }}
          />
        ))}
      </div>
    </div>
  </section>
);

export default Categories;
