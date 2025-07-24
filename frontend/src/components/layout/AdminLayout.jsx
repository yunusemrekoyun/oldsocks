// src/components/layout/AdminLayout.jsx
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
} from "@heroicons/react/24/solid";

export default function AdminLayout({ children }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const navItems = [
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

  const isActive = (path) => location.pathname === path;

  const SidebarContent = (
    <Card className="h-full w-full p-4 shadow-xl shadow-blue-gray-900/5">
      <Typography variant="h5" color="blue-gray" className="mb-6">
        Admin Panel
      </Typography>
      <List>
        {navItems.map(({ label, icon, path }) => (
          <Link
            key={path}
            to={path}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded px-3 py-2 text-sm font-medium transition-all
              ${
                isActive(path)
                  ? "bg-blue-100 text-blue-700 font-semibold"
                  : "hover:bg-gray-100 text-gray-800"
              }`}
          >
            <ListItemPrefix>{icon}</ListItemPrefix>
            {label}
          </Link>
        ))}
      </List>
    </Card>
  );

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar Desktop */}
      <div className="hidden md:block w-64 h-full sticky top-0">
        {SidebarContent}
      </div>

      {/* Sidebar Mobile */}
      <Drawer open={open} onClose={() => setOpen(false)} className="md:hidden">
        <div className="p-4 flex justify-between items-center">
          <Typography variant="h6">Menü</Typography>
          <IconButton variant="text" onClick={() => setOpen(false)}>
            <XMarkIcon className="h-5 w-5 text-gray-700" />
          </IconButton>
        </div>
        {SidebarContent}
      </Drawer>

      {/* Toggle Button */}
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
