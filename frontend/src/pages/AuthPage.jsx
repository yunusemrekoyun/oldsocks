// src/pages/AuthPage.jsx
import React from "react";
import Auth from "../components/auth/Auth";
import UserAccount from "../components/user/UserAccount";

const AuthPage = () => {
  // Bu fonksiyon yerine ileride token kontrolü veya context kullanılacak
  const isLoggedIn = false; // 👈 test için burayı true/false yaparak değiştir

  return (
    <div className="min-h-screen p-10">
      {isLoggedIn ? <UserAccount /> : <Auth />}
    </div>
  );
};

export default AuthPage;