// src/pages/AuthPage.jsx
import React, { useContext } from "react";
import Auth from "../components/auth/Auth";
import UserAccountLayout from "../components/user/UserAccountLayout";
import { AuthContext } from "../context/AuthContext";

export default function AuthPage() {
  const { isLoggedIn } = useContext(AuthContext);

  return (
    <div className="min-h-screen p-10">
      {isLoggedIn ? <UserAccountLayout /> : <Auth />}
    </div>
  );
}
