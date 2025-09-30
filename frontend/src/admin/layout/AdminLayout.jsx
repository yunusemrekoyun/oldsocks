// src/components/layout/AdminLayout.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import useUnseenOrders from "../../hooks/useUnseenOrders";
import useUnseenComments from "../../hooks/useUnseenComments";
import useUnseenReplies from "../../hooks/useUnseenReplies";

import {
  Card,
  Typography,
  List,
  ListItemPrefix,
  Drawer,
  IconButton,
} from "@material-tailwind/react";
import {
  TagIcon,
  ShoppingBagIcon,
  UserCircleIcon,
  HomeIcon,
  Bars3Icon,
  XMarkIcon,
  PencilIcon as BlogIcon,
  ChatBubbleLeftEllipsisIcon,
  CameraIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  TruckIcon,
} from "@heroicons/react/24/solid";

/* --------- Küçük yardımcı --------- */
const cx = (...cls) => cls.filter(Boolean).join(" ");

/* --------- Ana Layout --------- */
export default function AdminLayout({ children }) {
  const location = useLocation();
  const { count: unseenOrders } = useUnseenOrders({ poll: true });
  const { count: unseenComments } = useUnseenComments({ poll: true });
  const { count: unseenReplies } = useUnseenReplies({ poll: true });

  const [open, setOpen] = useState(false); // mobile drawer
  const [blogMenuOpen, setBlogMenuOpen] = useState(false);
  const [commentsMenuOpen, setCommentsMenuOpen] = useState(false);
  const [instagramMenuOpen, setInstagramMenuOpen] = useState(false);

  // Drawer açıkken body scroll’u kilitle
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => (document.body.style.overflow = prev);
    }
  }, [open]);

  // Aktif rota kontrolü
  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  // İlk yüklemede ilgili alt menüyü açık getir
  useEffect(() => {
    setBlogMenuOpen(
      isActive("/admin/blogs") || isActive("/admin/blog-categories")
    );
    setCommentsMenuOpen(
      isActive("/admin/comments") || isActive("/admin/replies")
    );
    setInstagramMenuOpen(isActive("/admin/instagram-posts"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navItems = useMemo(
    () => [
      { label: "Ana Sayfa", icon: <HomeIcon className="w-5 h-5" />, path: "/" },
      {
        label: "Kategoriler",
        icon: <TagIcon className="w-5 h-5" />,
        path: "/admin/categories",
      },
      {
        label: "Ürünler",
        icon: <ShoppingBagIcon className="w-5 h-5" />,
        path: "/admin/products",
      },
      {
        label: "Kargo",
        icon: <TruckIcon className="w-5 h-5" />,
        path: "/admin/shipping",
      },
      {
        label: "İndirimler",
        icon: <TagIcon className="w-5 h-5" />,
        path: "/admin/discounts",
      },
      {
        label: "Kullanıcılar",
        icon: <UserCircleIcon className="w-5 h-5" />,
        path: "/admin/users",
      },
      {
        label: "Banner Ayarları",
        icon: <CameraIcon className="w-5 h-5" />,
        path: "/admin/hero-videos",
      },
      {
        label: "Kampanyalar",
        icon: <TagIcon className="w-5 h-5" />,
        path: "/admin/campaigns",
      },
      {
        label: "Mini Kampanyalar",
        icon: <TagIcon className="w-5 h-5" />,
        path: "/admin/minicampaigns",
      },
      {
        label: "Siparişler",
        icon: <ShoppingBagIcon className="w-5 h-5" />,
        path: "/admin/orders",
      },
    ],
    []
  );

  /* --------- Sidebar Bileşeni --------- */
  const SidebarContent = (
    <Card className="h-full w-full p-4 shadow-xl rounded-none">
      {/* Logo / Başlık */}
      <div className="flex items-center justify-between mb-4">
        <Typography variant="h5" color="blue-gray">
          Admin Panel
        </Typography>
      </div>

      {/* Scroll alanı */}
      <div
        className="overflow-y-auto pr-1 custom-scrollbar"
        // 100svh: mobil tarayıcı chrome/safari adres çubuğu dinamiklerinde daha tutarlı yükseklik
        style={{ maxHeight: "calc(100svh - 100px)" }}
      >
        <List className="space-y-1">
          {/* Düz linkler */}
          {navItems.map(({ label, icon, path }) => {
            const active = isActive(path);
            return (
              <Link
                key={path}
                to={path}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "relative flex items-center gap-3 rounded px-3 py-2 text-sm font-medium transition",
                  "focus:outline-none focus:ring-2 focus:ring-blue-200",
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "hover:bg-gray-100 text-gray-800"
                )}
              >
                {/* Aktif sol şerit */}
                <span
                  aria-hidden="true"
                  className={cx(
                    "absolute left-0 top-0 h-full w-1 rounded-r",
                    active ? "bg-blue-600" : "bg-transparent"
                  )}
                />
                <ListItemPrefix>{icon}</ListItemPrefix>
                <span className="truncate">{label}</span>
                {path === "/admin/orders" && unseenOrders > 0 && (
                  <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-red-600 text-white text-[10px]">
                    {unseenOrders > 99 ? "99+" : unseenOrders}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Bloglar menüsü */}
          <button
            onClick={() => setBlogMenuOpen((o) => !o)}
            className={cx(
              "w-full text-left relative flex items-center gap-3 rounded px-3 py-2 text-sm font-medium transition",
              "focus:outline-none focus:ring-2 focus:ring-blue-200",
              isActive("/admin/blogs") || isActive("/admin/blog-categories")
                ? "bg-blue-50 text-blue-700"
                : "hover:bg-gray-100 text-gray-800"
            )}
          >
            <span
              aria-hidden="true"
              className={cx(
                "absolute left-0 top-0 h-full w-1 rounded-r",
                isActive("/admin/blogs") || isActive("/admin/blog-categories")
                  ? "bg-blue-600"
                  : "bg-transparent"
              )}
            />
            <ListItemPrefix>
              <BlogIcon className="w-5 h-5" />
            </ListItemPrefix>
            <span className="truncate">Bloglar</span>
            <span className="ml-auto">
              {blogMenuOpen ? (
                <ChevronDownIcon className="w-4 h-4" />
              ) : (
                <ChevronRightIcon className="w-4 h-4" />
              )}
            </span>
          </button>
          <div
            className={cx(
              "pl-10 space-y-1 overflow-hidden transition-[max-height] duration-300",
              blogMenuOpen ? "max-h-40" : "max-h-0"
            )}
          >
            <Link
              to="/admin/blogs"
              onClick={() => setOpen(false)}
              className={cx(
                "block rounded px-3 py-1 text-sm transition",
                "focus:outline-none focus:ring-2 focus:ring-blue-200",
                isActive("/admin/blogs")
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : "hover:bg-gray-100 text-gray-800"
              )}
            >
              Bloglar
            </Link>
            <Link
              to="/admin/blog-categories"
              onClick={() => setOpen(false)}
              className={cx(
                "block rounded px-3 py-1 text-sm transition",
                "focus:outline-none focus:ring-2 focus:ring-blue-200",
                isActive("/admin/blog-categories")
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : "hover:bg-gray-100 text-gray-800"
              )}
            >
              Blog Kategorileri
            </Link>
          </div>

          {/* Yorumlar menüsü */}
          <button
            onClick={() => setCommentsMenuOpen((o) => !o)}
            className={cx(
              "w-full text-left relative flex items-center gap-3 rounded px-3 py-2 text-sm font-medium transition",
              "focus:outline-none focus:ring-2 focus:ring-blue-200",
              isActive("/admin/comments") || isActive("/admin/replies")
                ? "bg-blue-50 text-blue-700"
                : "hover:bg-gray-100 text-gray-800"
            )}
          >
            <span
              aria-hidden="true"
              className={cx(
                "absolute left-0 top-0 h-full w-1 rounded-r",
                isActive("/admin/comments") || isActive("/admin/replies")
                  ? "bg-blue-600"
                  : "bg-transparent"
              )}
            />
            <ListItemPrefix>
              <ChatBubbleLeftEllipsisIcon className="w-5 h-5" />
            </ListItemPrefix>
            <span className="truncate">Yorumlar</span>
            <div className="ml-auto flex items-center gap-1">
              {unseenComments + unseenReplies > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-red-600 text-white text-[10px]">
                  {unseenComments + unseenReplies > 99
                    ? "99+"
                    : unseenComments + unseenReplies}
                </span>
              )}
              {commentsMenuOpen ? (
                <ChevronDownIcon className="w-4 h-4" />
              ) : (
                <ChevronRightIcon className="w-4 h-4" />
              )}
            </div>
          </button>
          <div
            className={cx(
              "pl-10 space-y-1 overflow-hidden transition-[max-height] duration-300",
              commentsMenuOpen ? "max-h-40" : "max-h-0"
            )}
          >
            <Link
              to="/admin/comments"
              onClick={() => setOpen(false)}
              className={cx(
                "rounded px-3 py-1 text-sm transition flex items-center justify-between",
                "focus:outline-none focus:ring-2 focus:ring-blue-200",
                isActive("/admin/comments")
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : "hover:bg-gray-100 text-gray-800"
              )}
            >
              <span>Yorumlar</span>
              {unseenComments > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-red-600 text-white text-[10px]">
                  {unseenComments > 99 ? "99+" : unseenComments}
                </span>
              )}
            </Link>

            <Link
              to="/admin/replies"
              onClick={() => setOpen(false)}
              className={cx(
                " rounded px-3 py-1 text-sm transition flex items-center justify-between",
                "focus:outline-none focus:ring-2 focus:ring-blue-200",
                isActive("/admin/replies")
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : "hover:bg-gray-100 text-gray-800"
              )}
            >
              <span>Yanıtlar</span>
              {unseenReplies > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-red-600 text-white text-[10px]">
                  {unseenReplies > 99 ? "99+" : unseenReplies}
                </span>
              )}
            </Link>
          </div>

          {/* Instagram menüsü */}
          <button
            onClick={() => setInstagramMenuOpen((o) => !o)}
            className={cx(
              "w-full text-left relative flex items-center gap-3 rounded px-3 py-2 text-sm font-medium transition",
              "focus:outline-none focus:ring-2 focus:ring-blue-200",
              isActive("/admin/instagram-posts")
                ? "bg-blue-50 text-blue-700"
                : "hover:bg-gray-100 text-gray-800"
            )}
          >
            <span
              aria-hidden="true"
              className={cx(
                "absolute left-0 top-0 h-full w-1 rounded-r",
                isActive("/admin/instagram-posts")
                  ? "bg-blue-600"
                  : "bg-transparent"
              )}
            />
            <ListItemPrefix>
              <CameraIcon className="w-5 h-5" />
            </ListItemPrefix>
            <span className="truncate">Instagram</span>
            <span className="ml-auto">
              {instagramMenuOpen ? (
                <ChevronDownIcon className="w-4 h-4" />
              ) : (
                <ChevronRightIcon className="w-4 h-4" />
              )}
            </span>
          </button>
          <div
            className={cx(
              "pl-10 space-y-1 overflow-hidden transition-[max-height] duration-300",
              instagramMenuOpen ? "max-h-24" : "max-h-0"
            )}
          >
            <Link
              to="/admin/instagram-posts"
              onClick={() => setOpen(false)}
              className={cx(
                "block rounded px-3 py-1 text-sm transition",
                "focus:outline-none focus:ring-2 focus:ring-blue-200",
                isActive("/admin/instagram-posts")
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : "hover:bg-gray-100 text-gray-800"
              )}
            >
              Gönderiler
            </Link>
          </div>
        </List>
      </div>
    </Card>
  );

  /* --------- Breadcrumb / Topbar --------- */
  const crumbs = useMemo(() => {
    const parts = location.pathname.split("/").filter(Boolean);
    const map = {
      admin: "Admin",
      categories: "Kategoriler",
      products: "Ürünler",
      users: "Kullanıcılar",
      campaigns: "Kampanyalar",
      minicampaigns: "Mini Kampanyalar",
      orders: "Siparişler",
      blogs: "Bloglar",
      "blog-categories": "Blog Kategorileri",
      comments: "Yorumlar",
      replies: "Yanıtlar",
      "instagram-posts": "Instagram",
      discounts: "İndirimler",
    };
    return parts.map((p) => map[p] || p);
  }, [location.pathname]);

  return (
    <div className="min-h-svh md:min-h-screen flex bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 md:sticky md:top-0 md:h-[100svh]">
        {SidebarContent}
      </aside>

      {/* Mobile Drawer */}
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        className="md:hidden"
        overlayProps={{ className: "bg-black/40 backdrop-blur-[2px]" }}
      >
        {/* Drawer header */}
        <div
          className="p-4 flex justify-between items-center border-b"
          style={{
            paddingTop: "max(env(safe-area-inset-top), 1rem)",
          }}
        >
          <Typography variant="h6">Menü</Typography>
          <IconButton variant="text" onClick={() => setOpen(false)}>
            <XMarkIcon className="h-5 w-5 text-gray-700" />
          </IconButton>
        </div>
        <div className="overflow-y-auto h-[calc(100svh-64px)]">
          {SidebarContent}
        </div>
      </Drawer>

      {/* Floating burger on mobile */}
      <div
        className="md:hidden fixed left-4 z-[999]"
        style={{ top: "calc(env(safe-area-inset-top) + 12px)" }}
      >
        <IconButton
          variant="text"
          onClick={() => setOpen(true)}
          aria-label="Menüyü aç"
          className="bg-white/80 backdrop-blur border border-gray-200 shadow"
        >
          <Bars3Icon className="h-6 w-6 text-gray-800" />
        </IconButton>
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top App Bar */}
        <header className="sticky top-0 z-[50] bg-gray-50/80 backdrop-blur supports-[backdrop-filter]:bg-gray-50/60 border-b">
          <div
            className="flex items-center justify-between px-4 md:px-6 h-14"
            style={{ paddingTop: "env(safe-area-inset-top)" }}
          >
            <div className="min-w-0">
              <div className="text-sm md:text-base font-medium text-gray-700 truncate">
                {crumbs.length ? crumbs.join(" / ") : "Ana Sayfa"}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-[10px] text-gray-600">
                ADM
              </div>
            </div>
          </div>
        </header>

        {/* Page body */}
        <main className="flex-1 p-4 md:p-6">{children}</main>

        {/* Footer */}
        <footer className="px-6 py-4 text-xs text-gray-500">
          © {new Date().getFullYear()} Admin Panel • Tüm hakları saklıdır.
        </footer>
      </div>
    </div>
  );
}

/* ---- opsiyonel: ince scrollbar (Tailwind global css’inize ekleyebilirsiniz) ----
.custom-scrollbar::-webkit-scrollbar { width: 8px; }
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(0,0,0,.12);
  border-radius: 9999px;
}
.custom-scrollbar:hover::-webkit-scrollbar-thumb { background-color: rgba(0,0,0,.2); }
*/
