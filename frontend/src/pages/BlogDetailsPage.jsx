// src/pages/BlogDetailsPage.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api";

import BreadCrumb from "../components/breadCrumb/BreadCrumb";
import BlogDetails from "../components/blog/BlogDetails";
import BlogDetailsPagination from "../components/blog/BlogDetailsPagination";
import BlogOwner from "../components/blog/BlogOwner";
import BlogComments from "../components/blog/BlogComments";
import BlogCommentInput from "../components/blog/BlogCommentInput";

import BlogSearch from "../components/blog/BlogSearch";
import BlogCategory from "../components/blog/BlogCategory";
import RecentBlog from "../components/blog/RecentBlog";
import Tags from "../components/blog/Tags";
import SocialMedia from "../components/blog/SocialMedia";
import NewsLetter from "../components/blog/NewsLetter";

export default function BlogDetailsPage() {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingComments, setLoadingComments] = useState(false);

  // Blog detayını al
  useEffect(() => {
    api
      .get(`/blogs/${slug}`)
      .then(({ data }) => setBlog(data))
      .catch((err) => {
        console.error("Blog yüklenemedi:", err);
        setBlog(null);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  // Yorumları getir
  const fetchComments = () => {
    if (!blog) return;
    setLoadingComments(true);

    api
      .get(`/comments/blogs/${blog._id}/comments`)
      .then(({ data }) => setComments(data))
      .catch((err) => console.error("Yorumlar yüklenemedi:", err))
      .finally(() => setLoadingComments(false));
  };

  // Blog yüklendiğinde yorumları çek
  useEffect(() => {
    if (blog) fetchComments();
  }, [blog]);

  if (loading) return <div className="py-10 text-center">Yükleniyor…</div>;
  if (!blog)
    return (
      <div className="py-10 text-center text-red-500">Blog bulunamadı.</div>
    );

  // Tarih, yazar, kategori vs.
  const date = new Date(blog.publishedAt || blog.createdAt)
    .toLocaleDateString("en-US", { day: "numeric", month: "short" })
    .replace(",", "");
  const authorName = `${blog.author.firstName} ${blog.author.lastName}`;
  const authorAvatar = blog.author.avatar;
  const categoryNames = blog.categories.map((c) => c.name).join(", ");
  const paragraphs = blog.content.split(/\n\s*\n/);

  return (
    <>
      <BreadCrumb />

      <main className="container mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sol bölüm */}
        <section className="lg:col-span-2">
          <BlogDetails
            image={blog.coverImageUrl}
            date={date}
            title={blog.title}
            author={authorName}
            category={categoryNames}
            comments={comments.length}
            paragraphs={paragraphs}
            quote={blog.excerpt}
          />

          <BlogDetailsPagination />

          <BlogOwner
            avatar={authorAvatar}
            name={authorName}
            bio={blog.author.bio || ""}
          />

          {/* Dinamik yorum listesi */}
          <BlogComments comments={comments} loading={loadingComments} />

          {/* Yorum gönderme */}
          <BlogCommentInput
            blogId={blog._id}
            onCommentPosted={fetchComments}
            // Not: BlogCommentInput içinde de endpoint'i şu şekilde ayarlayın:
            // api.post(`/comments/blogs/${blogId}/comments`, { text })
          />
        </section>

        {/* Sağ sidebar */}
        <aside className="lg:col-span-1 space-y-8">
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
