// src/components/BreadCrumb.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";

const PATH_TRANSLATE = {
  "": "Ana Sayfa",
  home: "Ana Sayfa",
  shop: "Mağaza",
  about: "Hakkımızda",
  blog: "Blog",
  contact: "İletişim",
  "product-details": "Mağaza",
  cart: "Sepet",
  checkout: "Ödeme",
  "payment-result": "Ödeme Sonucu",
  auth: "Giriş / Kayıt",
  profile: "Profil",
  admin: "Yönetim Paneli",
  products: "Ürünler",
  users: "Kullanıcılar",
  categories: "Kategoriler",
  campaigns: "Kampanyalar",
  minicampaigns: "Mini Kampanyalar",
  blogs: "Bloglar",
  "blog-categories": "Blog Kategorileri",
  orders: "Siparişler",
  comments: "Yorumlar",
  replies: "Yanıtlar",
  "instagram-posts": "Instagram Gönderileri",
  create: "Oluştur",
  edit: "Düzenle",
};

const BreadCrumb = () => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  return (
    <div className="bg-gray-100 py-3">
      <div className="container mx-auto px-4 text-sm text-gray-600">
        <Link to="/" className="hover:underline">
          Ana Sayfa
        </Link>
        {pathnames.map((name, index) => {
          const routeTo = "/" + pathnames.slice(0, index + 1).join("/");
          const isLast = index === pathnames.length - 1;
          const label = PATH_TRANSLATE[name] || decodeURIComponent(name);

          return (
            <span key={index} className="ml-2">
              <span className="mx-1">/</span>
              {isLast ? (
                <span className="font-medium text-gray-800">{label}</span>
              ) : (
                <Link to={routeTo} className="hover:underline">
                  {label}
                </Link>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default BreadCrumb;
