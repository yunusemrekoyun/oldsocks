// src/pages/BlogPage.jsx
import React from "react";
import BreadCrumb from "../components/breadCrumb/BreadCrumb";
import BlogItem from "../components/blog/BlogItem";
import BlogSearch from "../components/blog/BlogSearch";
import BlogCategory from "../components/blog/BlogCategory";
import RecentBlog from "../components/blog/RecentBlog";
import Tags from "../components/blog/Tags";
import SocialMedia from "../components/blog/SocialMedia";
import NewsLetter from "../components/blog/NewsLetter";
import BlogPagination from "../components/blog/BlogPagination";

// Örnek veri – kendi verinizle değiştirin
import post1 from "../assets/blog/blog1.png";
import post2 from "../assets/blog/blog2.png";
import post3 from "../assets/blog/blog3.png";
import post4 from "../assets/blog/blog4.png";

const blogPosts = [
  {
    id: 1,
    image: post1,
    date: "15 Jan",
    title: "Google inks pact for new 35-storey office",
    excerpt:
      "That dominion stars lights dominion divide years for fourth have dont...",
    author: "Travel, Lifestyle",
    category: "Travel",
    comments: 3,
  },
  {
    id: 2,
    image: post2,
    date: "15 Jan",
    title: "Google inks pact for new 35-storey office",
    excerpt:
      "That dominion stars lights dominion divide years for fourth have dont...",
    author: "Travel, Lifestyle",
    category: "Travel",
    comments: 3,
  },
  {
    id: 3,
    image: post3,
    date: "15 Jan",
    title: "Google inks pact for new 35-storey office",
    excerpt:
      "That dominion stars lights dominion divide years for fourth have dont...",
    author: "Travel, Lifestyle",
    category: "Travel",
    comments: 3,
  },
  {
    id: 4,
    image: post4,
    date: "15 Jan",
    title: "Google inks pact for new 35-storey office",
    excerpt:
      "That dominion stars lights dominion divide years for fourth have dont...",
    author: "Travel, Lifestyle",
    category: "Travel",
    comments: 3,
  },
];

const BlogPage = () => (
  <>
    <BreadCrumb />

    <main className="container mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Blog list (sol) */}
      <section className="lg:col-span-2">
        {blogPosts.map((p) => (
          <BlogItem key={p.id} {...p} />
        ))}

        <BlogPagination />
      </section>

      {/* Sidebar (sağ) */}
      <aside className="lg:col-span-1">
        <BlogSearch />
        <BlogCategory />
        <RecentBlog />
        <Tags />
        <SocialMedia />
        <NewsLetter />
      </aside>
    </main>
  </>
);

export default BlogPage;
