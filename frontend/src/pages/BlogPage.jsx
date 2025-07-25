// src/pages/BlogPage.jsx
import React, { useEffect, useState } from "react";
import api from "../../api";
import BreadCrumb from "../components/breadCrumb/BreadCrumb";
import BlogItem from "../components/blog/BlogItem";
import BlogSearch from "../components/blog/BlogSearch";
import BlogCategory from "../components/blog/BlogCategory";
import RecentBlog from "../components/blog/RecentBlog";
import Tags from "../components/blog/Tags";
import SocialMedia from "../components/blog/SocialMedia";
import NewsLetter from "../components/blog/NewsLetter";
import BlogPagination from "../components/blog/BlogPagination";

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/blogs")
      .then(({ data }) => setPosts(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-10 text-center">Yükleniyor…</div>;

  return (
    <>
      <BreadCrumb />
      <main className="container mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Sol sütun */}
        <section className="lg:col-span-2 space-y-10">
          {posts.map((post) => (
            <BlogItem
              key={post._id}
              to={`/blog/${post.slug}`}
              image={post.coverImageUrl}
              date={new Date(post.publishedAt || post.createdAt)
                .toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "short",
                })
                .replace(",", "")}
              title={post.title}
              excerpt={post.excerpt}
              author={`${post.author.firstName} ${post.author.lastName}`}
              category={post.categories.map((c) => c.name).join(", ")}
              comments={post.commentsCount} // buraya dikkat!
            />
          ))}
          <BlogPagination />
        </section>

        {/* Sağ sütun (sidebar) */}
        <aside className="lg:col-span-1 space-y-6">
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
}
