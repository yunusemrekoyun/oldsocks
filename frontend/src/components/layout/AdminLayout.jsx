// src/components/layout/AdminLayout.jsx
import React from "react";
import { Link } from "react-router-dom";
import {
  Card,
  Typography,
  List,
  ListItem,
  ListItemPrefix,
  Sidebar,
} from "@material-tailwind/react";
import {
  TagIcon,
  ShoppingBagIcon,
  UserCircleIcon,
  HomeIcon,
} from "@heroicons/react/24/solid";

export default function AdminLayout({ children }) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg">
        <Card className="h-full flex flex-col p-4">
          <Typography variant="h5" className="mb-6">
            Admin Panel
          </Typography>
          <List className="flex-grow">
            <ListItem className="p-2 hover:bg-gray-100 rounded-md">
              <ListItemPrefix>
                <HomeIcon className="w-5 h-5 text-gray-600" />
              </ListItemPrefix>
              <Link to="/">Ana Sayfa</Link>
            </ListItem>
            <ListItem className="p-2 hover:bg-gray-100 rounded-md">
              <ListItemPrefix>
                <TagIcon className="w-5 h-5 text-gray-600" />
              </ListItemPrefix>
              <Link to="/admin/categories">Kategoriler</Link>
            </ListItem>
            <ListItem className="p-2 hover:bg-gray-100 rounded-md">
              <ListItemPrefix>
                <ShoppingBagIcon className="w-5 h-5 text-gray-600" />
              </ListItemPrefix>
              <Link to="/admin/products">Ürünler</Link>
            </ListItem>
            <ListItem className="p-2 hover:bg-gray-100 rounded-md">
              <ListItemPrefix>
                <UserCircleIcon className="w-5 h-5 text-gray-600" />
              </ListItemPrefix>
              <Link to="/admin/users">Kullanıcılar</Link>
            </ListItem>
          </List>
        </Card>
      </aside>

      {/* Main content */}
      <div className="flex-1 bg-gray-50 p-6">{children}</div>
    </div>
  );
}
