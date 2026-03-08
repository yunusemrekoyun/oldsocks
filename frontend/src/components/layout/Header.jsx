// src/components/layout/Header.jsx
import React, { useContext, useState, useEffect, useRef, useMemo } from "react";
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
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import Logout from "../auth/Logout";
import { AuthContext } from "../../context/AuthContext";
import { useCart } from "../../context/useCart";
import SearchModal from "../search/SearchModal";
import useCategoriesCache from "../../hooks/useCategoriesCache";
import logo from "../../assets/logo/logo.png";
import api from "../../../api";

const DISCOUNT_HOVER_KEY = "__discount_campaigns__";

const Header = () => {
  const { isLoggedIn } = useContext(AuthContext);
  const { items } = useCart();

  const [showSearch, setShowSearch] = useState(false);

  // Mobil Drawer
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false); // animasyon

  // Mağaza dropdown (desktop)
  const [shopOpen, setShopOpen] = useState(false);
  const [hoverParent, setHoverParent] = useState(null);
  const closeTimer = useRef(null);
  const navigate = useNavigate();

  // Mobil akordeon: açık parent id'leri
  const [openParents, setOpenParents] = useState(() => new Set());
  const [headerCampaigns, setHeaderCampaigns] = useState([]);

  const { data: cachedCategories } = useCategoriesCache();
  const cats = useMemo(
    () => (Array.isArray(cachedCategories) ? cachedCategories : []),
    [cachedCategories]
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await api.get("/cart-campaigns/header");
        if (!alive) return;
        setHeaderCampaigns(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Header kampanyaları alınamadı:", e);
        if (alive) setHeaderCampaigns([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // id helper
  const getId = (maybeObj) =>
    typeof maybeObj === "object" && maybeObj?._id
      ? String(maybeObj._id)
      : String(maybeObj || "");

  const parents = useMemo(() => cats.filter((c) => !c.parent), [cats]);
  const childrenOf = (parentId) =>
    cats.filter((c) => c.parent && getId(c.parent) === String(parentId));
  const topPanelCampaigns = useMemo(
    () => headerCampaigns.filter((c) => c.headerPlacement === "top_panel"),
    [headerCampaigns]
  );
  const subPanelCampaigns = useMemo(
    () => headerCampaigns.filter((c) => c.headerPlacement === "sub_panel"),
    [headerCampaigns]
  );
  const allMobileCampaigns = useMemo(
    () => [...topPanelCampaigns, ...subPanelCampaigns],
    [topPanelCampaigns, subPanelCampaigns]
  );

  // Desktop hover’lı menüde children
  const isDiscountHover = hoverParent === DISCOUNT_HOVER_KEY;
  const hoveredParentObj = isDiscountHover
    ? null
    : cats.find((x) => getId(x._id) === String(hoverParent));
  const currentChildren = isDiscountHover
    ? subPanelCampaigns
    : hoveredParentObj?.children?.length
    ? hoveredParentObj.children
    : childrenOf(hoverParent);
  const hasChildren = (currentChildren || []).length > 0;
  const hasRightPanel = hasChildren;

  // Desktop dropdown açık/kapalı
  const openMenu = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setShopOpen(true);
    setHoverParent(null);
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
    setDrawerVisible(false);
    navigate("/shop", { state: { preset } });
  };

  // Mobil drawer animasyonu
  useEffect(() => {
    if (mobileMenuOpen) {
      // çizimden sonra translateX’i sıfırla
      const t = setTimeout(() => setDrawerVisible(true), 10);
      return () => clearTimeout(t);
    } else {
      setDrawerVisible(false);
    }
  }, [mobileMenuOpen]);

  // Akordeon toggle
  const toggleParentOpen = (pid) => {
    setOpenParents((prev) => {
      const next = new Set(prev);
      if (next.has(pid)) next.delete(pid);
      else next.add(pid);
      return next;
    });
  };

  const menuItems = [
    { label: "Ana Sayfa", path: "/" },
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
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden text-dark2 text-xl"
              aria-label="Menüyü Aç"
            >
              <FaBars />
            </button>

            <Link to="/" className="flex items-center">
              <img
                src={logo}
                alt="Oldsocks Logo"
                className="h-16 w-auto object-contain"
              />
            </Link>

            {/* Menü - Desktop */}
            <nav className="hidden lg:flex gap-8 text-base font-normal text-dark2 relative">
              <Link to="/" className="hover:text-brand transition-colors">
                Ana Sayfa
              </Link>

              {/* Mağaza (hover → mega menü) */}
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
                      (hasRightPanel
                        ? "w-[900px] grid grid-cols-2 gap-6"
                        : "w-[420px]")
                    }
                    onMouseEnter={openMenu}
                    onMouseLeave={scheduleClose}
                  >
                    {/* Sol kolon: Fırsatlar + Parent kategoriler */}
                    <div
                      className={
                        hasRightPanel ? "border-r border-light2 pr-4" : ""
                      }
                    >
                      {/* Fırsatlar */}
                      <div className="mb-4">
                        <button
                          onMouseEnter={() => {
                            if (subPanelCampaigns.length > 0) {
                              setHoverParent(DISCOUNT_HOVER_KEY);
                            } else {
                              setHoverParent(null);
                            }
                          }}
                          onClick={() => goShopWith({ discountOnly: true })}
                          className={`w-full text-left px-3 py-2 font-medium text-red-600 ${
                            hoverParent === DISCOUNT_HOVER_KEY
                              ? "bg-red-50 rounded-lg"
                              : "animate-pulse"
                          }`}
                          title="İndirimdeki tüm ürünler"
                        >
                          İndirim
                        </button>

                        {topPanelCampaigns.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {topPanelCampaigns.map((c) => (
                              <li key={c._id}>
                                <button
                                  onClick={() =>
                                    goShopWith({
                                      title: c.name,
                                      productIds: c.productIds || [],
                                    })
                                  }
                                  className="w-full text-left px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition text-sm"
                                >
                                  {c.name}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div className="text-xs uppercase text-dark2 mb-2">
                        Kategoriler
                      </div>
                      <ul className="space-y-1">
                        {parents.map((p) => (
                          <li key={p._id}>
                            <button
                              onMouseEnter={() => setHoverParent(p._id)}
                              onClick={() =>
                                goShopWith({
                                  category: [p._id],
                                  subCategory: [],
                                })
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

                    {/* Sağ kolon: Alt Kategoriler */}
                    {hasRightPanel && (
                      <div className="pl-2">
                        <div className="text-xs uppercase text-dark2 mb-2">
                          {isDiscountHover ? "Kampanyalar" : "Alt Kategoriler"}
                        </div>
                        {isDiscountHover ? (
                          <ul className="space-y-2">
                            {currentChildren.map((c) => (
                              <li key={c._id}>
                                <button
                                  onClick={() =>
                                    goShopWith({
                                      title: c.name,
                                      productIds: c.productIds || [],
                                    })
                                  }
                                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 transition"
                                >
                                  {c.name}
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : (
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
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Diğer menüler */}
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

      {/* =================== Mobil Drawer =================== */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60]">
          {/* Backdrop */}
          <div
            className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity ${
              drawerVisible ? "opacity-100" : "opacity-0"
            }`}
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Panel */}
          <div
            className={`absolute left-0 top-0 h-full w-[86%] max-w-sm bg-white shadow-2xl border-r border-light2 transform transition-transform duration-300 ${
              drawerVisible ? "translate-x-0" : "-translate-x-full"
            } flex flex-col`}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-light2">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center"
              >
                <img
                  src={logo}
                  alt="Oldsocks Logo"
                  className="h-10 w-auto object-contain"
                />
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full border border-light3 hover:bg-light1"
                aria-label="Kapat"
              >
                <FaTimes className="text-dark2" />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="px-4 pt-3 pb-1 grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate("/shop");
                }}
                className="px-3 py-2 rounded-lg bg-light1 hover:bg-light1/80 border border-light2 text-sm"
              >
                Mağaza
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  goShopWith({ discountOnly: true });
                }}
                className="px-3 py-2 rounded-lg bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 text-sm"
              >
                İndirim
              </button>
              <button
                onClick={() => {
                  setShowSearch(true);
                  setMobileMenuOpen(false);
                }}
                className="px-3 py-2 rounded-lg bg-light1 hover:bg-light1/80 border border-light2 text-sm"
              >
                Ara
              </button>
            </div>

            {allMobileCampaigns.length > 0 && (
              <div className="px-4 py-2">
                <div className="rounded-xl border border-red-100 bg-red-50/50 p-3">
                  <div className="text-xs font-semibold text-red-600 mb-2 uppercase">
                    Kampanyalar
                  </div>
                  <div className="space-y-1">
                    {allMobileCampaigns.map((c) => (
                      <button
                        key={c._id}
                        onClick={() => {
                          setMobileMenuOpen(false);
                          goShopWith({
                            title: c.name,
                            productIds: c.productIds || [],
                          });
                        }}
                        className="w-full text-left px-2 py-1.5 rounded-lg text-sm text-red-700 hover:bg-red-100 transition"
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Links */}
            <nav className="px-4 py-2 space-y-2 overflow-y-auto">
              <Link
                to="/"
                className="block px-4 py-3 rounded-xl hover:bg-light1 transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                Ana Sayfa
              </Link>

              {/* Kategoriler (akordeon kart) */}
              <div className="rounded-2xl border border-light2 overflow-hidden">
                <div className="px-4 py-2 text-xs uppercase text-dark2 bg-light1/60">
                  Kategoriler
                </div>
                <ul className="divide-y divide-light2">
                  {parents.map((p) => {
                    const pid = String(p._id);
                    const children =
                      (p.children && p.children.length
                        ? p.children
                        : childrenOf(pid)) || [];
                    const isOpen = openParents.has(pid);

                    return (
                      <li key={pid} className="bg-white">
                        <div className="flex items-center">
                          <button
                            onClick={() =>
                              goShopWith({ category: [pid], subCategory: [] })
                            }
                            className="flex-1 text-left px-4 py-3 hover:bg-light1 transition"
                          >
                            {p.name}
                          </button>
                          {children.length > 0 && (
                            <button
                              onClick={() => toggleParentOpen(pid)}
                              className="px-3 py-3 hover:bg-light1 transition"
                              aria-label="Alt kategorileri aç/kapat"
                            >
                              {isOpen ? (
                                <ChevronDownIcon className="w-4 h-4 text-dark2" />
                              ) : (
                                <ChevronRightIcon className="w-4 h-4 text-dark2" />
                              )}
                            </button>
                          )}
                        </div>

                        {children.length > 0 && isOpen && (
                          <ul className="bg-light1/60 px-2 py-2 grid grid-cols-1 gap-1">
                            {children.map((sc) => (
                              <li key={sc._id}>
                                <button
                                  onClick={() =>
                                    goShopWith({
                                      category: [],
                                      subCategory: [sc._id],
                                    })
                                  }
                                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-light1 transition text-sm"
                                >
                                  {sc.name}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>

              {menuItems.slice(1).map(({ label, path }) => (
                <Link
                  key={path}
                  to={path}
                  className="block px-4 py-3 rounded-xl hover:bg-light1 transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      <SearchModal open={showSearch} onClose={() => setShowSearch(false)} />
    </header>
  );
};

export default Header;
