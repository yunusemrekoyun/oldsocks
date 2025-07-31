import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaInstagram,
  FaFacebookF,
  FaSearch,
  FaShoppingCart,
  FaUser,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import Logout from "../auth/Logout";
import { AuthContext } from "../../context/AuthContext";
import { useCart } from "../../context/useCart";
import SearchModal from "../search/SearchModal";

const Header = () => {
  const { isLoggedIn } = useContext(AuthContext);
  const { items } = useCart();
  const [showSearch, setShowSearch] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { label: "Ana Sayfa", path: "/" },
    { label: "Mağaza", path: "/shop" },
    { label: "Hakkımızda", path: "/about" },
    { label: "Blog", path: "/blog" },
    { label: "İletişim", path: "/contact" },
  ];

  return (
    <header className="bg-light1 border-b border-light2 relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-24">
          {/* Sol: Logo + Menü */}
          <div className="flex items-center gap-4">
            {/* Hamburger - Mobil */}
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="lg:hidden text-dark2 text-xl"
            >
              {mobileMenuOpen ? <FaTimes /> : <FaBars />}
            </button>

            <Link to="/" className="flex items-center">
              <img
                src="../src/assets/logo/logo.png"
                alt="Oldsocks Logo"
                className="h-16 w-auto object-contain"
              />
            </Link>

            {/* Menü - Desktop */}
            <nav className="hidden lg:flex gap-8 text-base font-normal text-dark2">
              {menuItems.map(({ label, path }) => (
                <Link
                  key={path}
                  to={path}
                  className="hover:text-brand transition-colors"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Sağ ikonlar */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex space-x-3">
              {[FaInstagram, FaFacebookF].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-10 h-10 flex items-center justify-center border border-light3 rounded-full hover:border-brand transition"
                >
                  <Icon className="text-dark2 hover:text-brand text-sm" />
                </a>
              ))}
            </div>

            <div
              className="flex w-10 h-10 items-center justify-center border border-light3 rounded-full hover:border-brand transition cursor-pointer"
              onClick={() => setShowSearch(true)}
            >
              <FaSearch className="text-dark2 hover:text-brand text-sm" />
            </div>

            <Link
              to="/cart"
              id="cart-icon"
              className="relative w-12 h-12 flex items-center justify-center bg-dark2 rounded-full hover:bg-brand transition"
            >
              <FaShoppingCart className="text-white text-base" />
              {items.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-light1 text-dark1 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow">
                  {items.length}
                </span>
              )}
            </Link>

            <Link
              to="/profile"
              className="w-12 h-12 flex items-center justify-center border border-light3 rounded-full hover:border-brand transition"
            >
              <FaUser className="text-dark2 hover:text-brand text-base" />
            </Link>

            {isLoggedIn && <Logout />}
          </div>
        </div>
      </div>

      {/* Mobil Menü Açılır */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-light1 border-t border-light2 absolute top-full left-0 w-full shadow-md z-40">
          <nav className="flex flex-col py-4 px-6 space-y-4 text-dark2 font-medium">
            {menuItems.map(({ label, path }) => (
              <Link
                key={path}
                to={path}
                className="hover:text-brand"
                onClick={() => setMobileMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      )}

      <SearchModal open={showSearch} onClose={() => setShowSearch(false)} />
    </header>
  );
};

export default Header;
