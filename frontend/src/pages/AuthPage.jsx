// src/pages/AuthPage.jsx
import React, { useContext } from "react";
import Auth from "../components/auth/Auth";
import UserAccount from "../components/user/UserAccount";
import { AuthContext } from "../context/AuthContext";

const AuthPage = () => {
  const { isLoggedIn } = useContext(AuthContext);

  // isLoggedIn zaten boolean, hemen render edebiliriz
  return (
    <div className="min-h-screen p-10">
      {isLoggedIn ? <UserAccount /> : <Auth />}
    </div>
  );
};

export default AuthPage;
