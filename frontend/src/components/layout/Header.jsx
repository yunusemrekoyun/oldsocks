// src/components/layout/Header.jsx
import React from "react";
import { Link } from "react-router-dom";
import {
  FaTwitter,
  FaFacebookF,
  FaPinterestP,
  FaSearch,
  FaShoppingCart,
} from "react-icons/fa";

const Header = () => (
  <header className="bg-light1 border-b border-light2">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-24">
        {/* Sol: Logo + Menü */}
        <div className="flex items-center space-x-10">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img
              src="../src/assets/logo/logo.png"
              alt="Oldsocks Logo"
              className="h-16 w-auto object-contain"
            />
          </Link>

          {/* Ana Menü */}
          <nav className="hidden lg:flex space-x-10 text-base font-normal text-dark2">
            {["Home", "Shop", "About", "Blog", "Contact"].map((item) => (
              <Link
                key={item}
                to={item === "Home" ? "/" : `/${item.toLowerCase()}`}
                className="hover:text-brand transition-colors"
              >
                {item}
              </Link>
            ))}
          </nav>
        </div>

        {/* Sağ: Sosyal + Arama + Sepet */}
        <div className="flex items-center space-x-5">
          {/* Sosyal ikonlar */}
          <div className="hidden md:flex space-x-3">
            {[FaTwitter, FaFacebookF, FaPinterestP].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="w-10 h-10 flex items-center justify-center border border-light3 rounded-full hover:border-brand transition"
              >
                <Icon className="text-dark2 hover:text-brand text-sm" />
              </a>
            ))}
          </div>

          {/* Arama */}
          <div className="hidden md:flex w-10 h-10 items-center justify-center border border-light3 rounded-full hover:border-brand transition">
            <FaSearch className="text-dark2 hover:text-brand text-sm" />
          </div>

          {/* Sepet */}
          <div className="relative w-12 h-12 flex items-center justify-center bg-dark2 rounded-full hover:bg-brand transition">
            <FaShoppingCart className="text-white text-base" />
            <span className="absolute -top-1 -right-1 bg-light1 text-dark1 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow">
              0
            </span>
          </div>
        </div>
      </div>
    </div>
  </header>
);

export default Header;
