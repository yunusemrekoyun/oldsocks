// src/components/BlogCategory.jsx
import React from "react";
import BlogCategoryItem from "./BlogCategoryItem";

const categories = [
  { name: "Restaurant food", count: 37 },
  { name: "Travel news", count: 10 },
  { name: "Modern technology", count: 3 },
  { name: "Product", count: 11 },
  { name: "Inspirational", count: 21 },
  { name: "Health Care", count: 25 },
];

const BlogCategory = () => (
  <div className="mb-8">
    <h4 className="text-lg font-semibold mb-3">Category</h4>
    <ul>
      {categories.map((c) => (
        <BlogCategoryItem key={c.name} {...c} />
      ))}
    </ul>
  </div>
);

export default BlogCategory;
