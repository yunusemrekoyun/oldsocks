// --- Updated src/components/layout/AdminLayout.jsx ---
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
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
} from "@heroicons/react/24/solid";

export default function AdminLayout({ children }) {
  const [open, setOpen] = useState(false);
  const [blogMenuOpen, setBlogMenuOpen] = useState(false);
  const [commentsMenuOpen, setCommentsMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    {
      label: "Ana Sayfa",
      icon: <HomeIcon className="w-5 h-5" />,
      path: "/admin",
    },
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
      label: "Kullanıcılar",
      icon: <UserCircleIcon className="w-5 h-5" />,
      path: "/admin/users",
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
  ];

  const isActive = (path) => location.pathname.startsWith(path);

  const SidebarContent = (
    <Card className="h-full w-full p-4 shadow-xl">
      <Typography variant="h5" color="blue-gray" className="mb-6">
        Admin Panel
      </Typography>
      <List className="space-y-1">
        {navItems.map(({ label, icon, path }) => (
          <Link
            key={path}
            to={path}
            onClick={() => {
              setOpen(false);
              setBlogMenuOpen(false);
              setCommentsMenuOpen(false);
            }}
            className={`flex items-center gap-3 rounded px-3 py-2 text-sm font-medium transition
              ${
                isActive(path)
                  ? "bg-blue-100 text-blue-700"
                  : "hover:bg-gray-100 text-gray-800"
              }`}
          >
            <ListItemPrefix>{icon}</ListItemPrefix>
            {label}
          </Link>
        ))}

        {/* Bloglar menüsü */}
        <button
          onClick={() => setBlogMenuOpen((o) => !o)}
          className={`w-full text-left flex items-center gap-3 rounded px-3 py-2 text-sm font-medium transition
            ${
              isActive("/admin/blogs") || isActive("/admin/blog-categories")
                ? "bg-blue-100 text-blue-700"
                : "hover:bg-gray-100 text-gray-800"
            }`}
        >
          <ListItemPrefix>
            <BlogIcon className="w-5 h-5" />
          </ListItemPrefix>
          Bloglar
        </button>
        {blogMenuOpen && (
          <div className="pl-10 space-y-1">
            <Link
              to="/admin/blogs"
              onClick={() => setOpen(false)}
              className={`block rounded px-3 py-1 text-sm transition
                ${
                  isActive("/admin/blogs")
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "hover:bg-gray-100 text-gray-800"
                }`}
            >
              Bloglar
            </Link>
            <Link
              to="/admin/blog-categories"
              onClick={() => setOpen(false)}
              className={`block rounded px-3 py-1 text-sm transition
                ${
                  isActive("/admin/blog-categories")
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "hover:bg-gray-100 text-gray-800"
                }`}
            >
              Blog Kategorileri
            </Link>
          </div>
        )}

        {/* Yorumlar menüsü */}
        <button
          onClick={() => setCommentsMenuOpen((o) => !o)}
          className={`w-full text-left flex items-center gap-3 rounded px-3 py-2 text-sm font-medium transition
            ${
              isActive("/admin/comments") || isActive("/admin/replies")
                ? "bg-blue-100 text-blue-700"
                : "hover:bg-gray-100 text-gray-800"
            }`}
        >
          <ListItemPrefix>
            <ChatBubbleLeftEllipsisIcon className="w-5 h-5" />
          </ListItemPrefix>
          Yorumlar
        </button>
        {commentsMenuOpen && (
          <div className="pl-10 space-y-1">
            <Link
              to="/admin/comments"
              onClick={() => setOpen(false)}
              className={`block rounded px-3 py-1 text-sm transition
                ${
                  isActive("/admin/comments")
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "hover:bg-gray-100 text-gray-800"
                }`}
            >
              Yorumlar
            </Link>
            <Link
              to="/admin/replies"
              onClick={() => setOpen(false)}
              className={`block rounded px-3 py-1 text-sm transition
                ${
                  isActive("/admin/replies")
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "hover:bg-gray-100 text-gray-800"
                }`}
            >
              Yanıtlar
            </Link>
          </div>
        )}
      </List>
    </Card>
  );

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 sticky top-0">{SidebarContent}</div>

      {/* Mobile Sidebar */}
      <Drawer open={open} onClose={() => setOpen(false)} className="md:hidden">
        <div className="p-4 flex justify-between items-center">
          <Typography variant="h6">Menü</Typography>
          <IconButton variant="text" onClick={() => setOpen(false)}>
            <XMarkIcon className="h-5 w-5 text-gray-700" />
          </IconButton>
        </div>
        {SidebarContent}
      </Drawer>

      {/* Mobile Toggle */}
      <div className="md:hidden fixed top-4 left-4 z-[999]">
        <IconButton variant="text" onClick={() => setOpen(true)}>
          <Bars3Icon className="h-6 w-6 text-gray-800" />
        </IconButton>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-6 pt-16 md:pt-6">{children}</main>
    </div>
  );
}
