// src/components/auth/RequireAdmin.jsx
import React, { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

export default function RequireAdmin() {
  const { isLoggedIn, role } = useContext(AuthContext);
  console.log("🚀 RequireAdmin:", { isLoggedIn, role });

  // 1) Henüz token var ama rol gelmemişse, bekle:
  if (isLoggedIn && role === null) {
    return null; // veya burada bir <LoadingSpinner /> koyabilirsiniz
  }

  // 2) Giriş yoksa ya da rol admin değilse anasayfaya gönder:
  if (!isLoggedIn || role !== "admin") {
    return <Navigate to="/" replace />;
  }

  // 3) Admin ise, child route’u render et:
  return <Outlet />;
}
