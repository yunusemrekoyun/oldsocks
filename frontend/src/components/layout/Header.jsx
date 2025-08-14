// src/components/layout/Header.jsx
import React, { useContext, useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import api from "../../../api";

const Header = () => {
  const { isLoggedIn } = useContext(AuthContext);
  const { items } = useCart();
  const [showSearch, setShowSearch] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Mağaza dropdown state
  const [cats, setCats] = useState([]);
  const [shopOpen, setShopOpen] = useState(false);
  const [hoverParent, setHoverParent] = useState(null);
  const closeTimer = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/categories").then(({ data }) => setCats(data)).catch(console.error);
  }, []);

  // id helper (parent hem string/id hem obje olabilir)
  const getId = (maybeObj) =>
    typeof maybeObj === "object" && maybeObj?._id ? String(maybeObj._id) : String(maybeObj || "");

  const parents = cats.filter((c) => !c.parent);

  // ÇOCUKLARI flat listeden üret (backend populate'a ihtiyaç duymadan)
  const childrenOf = (parentId) =>
    cats.filter((c) => c.parent && getId(c.parent) === String(parentId));

  // Menü aç/kapa (flicker önleme)
  const openMenu = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setShopOpen(true);
    setHoverParent(null); // açıldığında sağ panel kapalı başlasın
  };
  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => {
      setShopOpen(false);
      setHoverParent(null);
    }, 250);
  };

  // Shop’a preset ile git
  const goShopWith = (preset) => {
    setShopOpen(false);
    setHoverParent(null);
    setMobileMenuOpen(false);
    navigate("/shop", { state: { preset } });
  };

  const menuItems = [
    { label: "Ana Sayfa", path: "/" },
    { label: "Hakkımızda", path: "/about" },
    { label: "Blog", path: "/blog" },
    { label: "İletişim", path: "/contact" },
  ];

  // Mevcut parent için children listesi:
  // - Eğer backend virtual `children` doldurmuşsa onu kullan
  // - Yoksa flat listeden türet
  const hoveredParentObj = cats.find((x) => getId(x._id) === String(hoverParent));
  const currentChildren =
    hoveredParentObj?.children?.length ? hoveredParentObj.children : childrenOf(hoverParent);
  const hasChildren = (currentChildren || []).length > 0;

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
            <nav className="hidden lg:flex gap-8 text-base font-normal text-dark2 relative">
              {/* 1) Ana Sayfa */}
              <Link to="/" className="hover:text-brand transition-colors">
                Ana Sayfa
              </Link>

              {/* 2) Mağaza (tıkla → /shop, hover → dropdown) */}
              <div
                className="relative"
                onMouseEnter={openMenu}
                onMouseLeave={scheduleClose}
              >
                <Link
                  to="/shop"
                  className="hover:text-brand transition-colors"
                  onClick={() => {
                    setShopOpen(false);
                    setHoverParent(null);
                  }}
                >
                  Mağaza
                </Link>

                {shopOpen && (
                  <div
                    className={
                      `absolute left-0 top-full mt-3 bg-white border border-light2 rounded-xl shadow-xl p-4 z-50 ` +
                      (hasChildren ? "w-[680px] grid grid-cols-2 gap-4" : "w-[360px]")
                    }
                    onMouseEnter={openMenu}
                    onMouseLeave={scheduleClose}
                  >
                    {/* Sol kolon: Parent kategoriler */}
                    <div className={hasChildren ? "border-r border-light2 pr-4" : ""}>
                      <div className="text-xs uppercase text-dark2 mb-2">
                        Kategoriler
                      </div>
                      <ul className="space-y-1">
                        {parents.map((p) => (
                          <li key={p._id}>
                            <button
                              onMouseEnter={() => setHoverParent(p._id)}
                              onClick={() =>
                                goShopWith({ category: [p._id], subCategory: [] })
                              }
                              className={`w-full text-left px-3 py-2 rounded-lg transition ${
                                hoverParent === p._id
                                  ? "bg-light1 text-dark1"
                                  : "hover:bg-light1"
                              }`}
                            >
                              {p.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Sağ kolon: SADECE alt kategori varsa görünür */}
                    {hasChildren && (
                      <div className="pl-2">
                        <div className="text-xs uppercase text-dark2 mb-2">
                          Alt Kategoriler
                        </div>
                        <ul className="grid grid-cols-2 gap-2">
                          {currentChildren.map((sc) => (
                            <li key={sc._id}>
                              <button
                                onClick={() =>
                                  goShopWith({
                                    category: [],
                                    subCategory: [sc._id],
                                  })
                                }
                                className="w-full text-left px-3 py-2 rounded-lg hover:bg-light1 transition"
                              >
                                {sc.name}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 3) Diğer menü öğeleri */}
              {menuItems.slice(1).map(({ label, path }) => (
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
              <a
                href="https://www.instagram.com/oldscks/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center border border-light3 rounded-full hover:border-brand transition"
              >
                <FaInstagram className="text-dark2 hover:text-brand text-sm" />
              </a>
              <a
                href="https://www.facebook.com/Oldsockscollection/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center border border-light3 rounded-full hover:border-brand transition"
              >
                <FaFacebookF className="text-dark2 hover:text-brand text-sm" />
              </a>
            </div>

            {/* Arama */}
            <div
              className="flex w-10 h-10 items-center justify-center border border-light3 rounded-full hover:border-brand transition cursor-pointer"
              onClick={() => setShowSearch(true)}
            >
              <FaSearch className="text-dark2 hover:text-brand text-sm" />
            </div>

            {/* Sepet */}
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

            {/* Profil */}
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

      {/* Mobil Menü */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-light1 border-t border-light2 absolute top-full left-0 w-full shadow-md z-40">
          <nav className="flex flex-col py-4 px-6 space-y-4 text-dark2 font-medium">
            <Link
              to="/"
              className="hover:text-brand"
              onClick={() => setMobileMenuOpen(false)}
            >
              Ana Sayfa
            </Link>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                navigate("/shop");
              }}
              className="text-left hover:text-brand"
            >
              Mağaza
            </button>
            {menuItems.slice(1).map(({ label, path }) => (
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