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

// Admin sayfaları
import ProductsPage from "./pages/admin/ProductsPage";
import AdminUsersPage from "./pages/admin/UsersPage";
import CategoriesPage from "./pages/admin/CategoriesPage";

const App = () => (
  <BrowserRouter>
    <Routes>
      {/* Public / User Routes */}
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

      {/* Admin Routes */}
      <Route element={<RequireAdmin />}>
        <Route
          path="/admin"
          element={
            <AdminLayout>
              <Outlet />
            </AdminLayout>
          }
        >
          <Route index element={<div>Hoş geldin Admin!</div>} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="categories" element={<CategoriesPage />} />
        </Route>
      </Route>
    </Routes>
  </BrowserRouter>
);

export default App;
