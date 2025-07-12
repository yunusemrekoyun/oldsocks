// src/pages/BlogDetailsPage.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import BreadCrumb from "../components/breadCrumb/BreadCrumb";
import BlogDetails from "../components/blog/BlogDetails";
import BlogDetailsPagination from "../components/blog/BlogDetailsPagination";
import BlogOwner from "../components/blog/BlogOwner";
import BlogComments from "../components/blog/BlogComments";
import BlogCommentInput from "../components/blog/BlogCommentInput";

// sidebar
import BlogSearch from "../components/blog/BlogSearch";
import BlogCategory from "../components/blog/BlogCategory";
import RecentBlog from "../components/blog/RecentBlog";
import Tags from "../components/blog/Tags";
import SocialMedia from "../components/blog/SocialMedia";
import NewsLetter from "../components/blog/NewsLetter";

// example post data
import postImg from "../assets/blog/blog1.png";
import ownerAvatar from "../assets/blog/blog-owner/author.png";

const dummyParagraphs = [
  "MCSE boot camps have its supporters and its detractors...",
  "However, who has the willpower to actually sit through...",
];

const BlogDetailsPage = () => (
  <>
    <BreadCrumb />

    <main className="container mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left: content */}
      <section className="lg:col-span-2">
        <BlogDetails
          image={postImg}
          date="15 Jan"
          title="Second divided from form fish beast made every of seas all gathered us saying he our"
          author="Travel, Lifestyle"
          category="Travel"
          comments={3}
          paragraphs={dummyParagraphs}
          quote="MCSE boot camps have its supporters and its detractors."
        />

        <BlogDetailsPagination />

        <BlogOwner
          avatar={ownerAvatar}
          name="Harvard Milan"
          bio="Second divided from form fish beast made. Every of seas all gathered us saying he."
        />

        <BlogComments />

        <BlogCommentInput />
      </section>

      {/* Right: sidebar */}
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

export default BlogDetailsPage;
