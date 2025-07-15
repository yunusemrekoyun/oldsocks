// src/components/auth/Auth.jsx
import React from "react";
import Login from "./Login";
import Register from "./Register";

const Auth = () => {
  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold">Lütfen Giriş Yapın veya Kayıt Olun</h2>
      <Login />
      <Register />
    </div>
  );
};

export default Auth;
