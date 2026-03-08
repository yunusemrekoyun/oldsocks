// src/App.jsx
import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
  Navigate,
} from "react-router-dom";
import Layout from "./components/layout/Layout";
import AdminLayout from "./admin/layout/AdminLayout";
import RequireAdmin from "./components/auth/RequireAdmin";
import RequireAuth from "./components/auth/RequireAuth";
import GuestCheckoutPage from "./pages/GuestCheckoutPage";
import HomePage from "./pages/HomePage";
import ShopPage from "./pages/ShopPage";
import AboutPage from "./pages/AboutPage";
import BlogPage from "./pages/BlogPage";
import ContactPage from "./pages/ContactPage";
import BlogDetailsPage from "./pages/BlogDetailsPage";
import ProductDetailsPage from "./pages/ProductDetailsPage";
import AuthPage from "./pages/AuthPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import PaymentResultPage from "./pages/PaymentResultPage";
import NotFoundPage from "./pages/NotFoundPage";
import PaymentPage from "./pages/PaymentPage";
import ScrollToTop from "./components/common/ScrollToTop";
import AgreementPage from "./pages/AgreementPage";
import KvkkPage from "./pages/KvkkPage";
import CookiePolicyPage from "./pages/CookiePolicyPage";
// Admin sayfaları
// import ProductsPage from "./admin/pages/ProductsPage";
import UsersPage from "./admin/pages/UsersPage";
import CategoriesPage from "./admin/pages/CategoriesPage";
import CampaignsPage from "./admin/pages/CampaignsPage";
import MiniCampaignsPage from "./admin/pages/MiniCampaignsPage";
import BlogsPage from "./admin/pages/BlogsPage";
import BlogCategoriesPage from "./admin/pages/BlogCategoriesPage";
import CommentsPage from "./admin/pages/CommentsPage";
import CommentRepliesPage from "./admin/pages/CommentRepliesPage";
import InstagramPostsPage from "./admin/pages/InstagramPostsPage";
import OrdersPage from "./admin/pages/OrdersPage";
import ProductListPage from "./admin/pages/ProductListPage";
import AdminUsersPage from "./admin/pages/UsersPage";
import DiscountsPage from "./admin/pages/DiscountsPage";
import HeroVideoPage from "./admin/pages/HeroVideoPage";
import ShippingMethodsPage from "./admin/pages/ShippingMethodsPage";
import AnnouncementBarPage from "./admin/pages/AnnouncementBarPage";
import CartCampaignsPage from "./admin/pages/CartCampaignsPage";
export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
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
          <Route path="/blog/:slug" element={<BlogDetailsPage />} />
          <Route path="/product-details/:id" element={<ProductDetailsPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout-guest" element={<GuestCheckoutPage />} />
          <Route path="/agreement" element={<AgreementPage />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/kvkk" element={<KvkkPage />} />
          <Route path="/cookies" element={<CookiePolicyPage />} />
          <Route
            path="/checkout"
            element={
              <RequireAuth>
                <CheckoutPage />
              </RequireAuth>
            }
          />
          <Route path="/payment-result" element={<PaymentResultPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/profile" element={<AuthPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
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
            <Route path="products" element={<ProductListPage />} />
            <Route path="discounts" element={<DiscountsPage />} />
            <Route path="cart-campaigns" element={<CartCampaignsPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="campaigns" element={<CampaignsPage />} />
            <Route path="minicampaigns" element={<MiniCampaignsPage />} />
            <Route path="blogs" element={<BlogsPage />} />
            <Route path="blog-categories" element={<BlogCategoriesPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="comments" element={<CommentsPage />} />
            <Route path="replies" element={<CommentRepliesPage />} />
            <Route path="instagram-posts" element={<InstagramPostsPage />} />
            <Route path="hero-videos" element={<HeroVideoPage />} />
            <Route path="shipping" element={<ShippingMethodsPage />} />
            <Route path="announcement-bar" element={<AnnouncementBarPage />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
