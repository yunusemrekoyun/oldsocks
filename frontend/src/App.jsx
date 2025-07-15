// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";

import Layout from "./components/layout/Layout";
import AdminLayout from "./components/layout/AdminLayout";
import RequireAdmin from "./components/auth/RequireAdmin";

import HomePage from "./pages/HomePage";
import ShopPage from "./pages/ShopPage";
import AboutPage from "./pages/AboutPage";
import BlogPage from "./pages/BlogPage";
import ContactPage from "./pages/ContactPage";
import BlogDetailsPage from "./pages/BlogDetailsPage";
import ProductDetailsPage from "./pages/ProductDetailsPage";
import AuthPage from "./pages/AuthPage";

const App = () => (
  <BrowserRouter>
    <Routes>
      {/* Public/User routes */}
      <Route
        element={
          <Layout>
            <Outlet />
          </Layout>
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/blog-details" element={<BlogDetailsPage />} />
        <Route path="/product-details" element={<ProductDetailsPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/profile" element={<AuthPage />} />
      </Route>

      {/* Admin routes */}
      <Route element={<RequireAdmin />}>
        <Route
          path="/admin/*"
          element={
            <AdminLayout>
              <Outlet />
            </AdminLayout>
          }
        >
          <Route index element={<div>Hoş geldin Admin!</div>} />
          {/* future: <Route path="users" element={<AdminUsersPage/>}/> */}
        </Route>
      </Route>
    </Routes>
  </BrowserRouter>
);

export default App;
