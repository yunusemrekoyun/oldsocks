// src/components/auth/Auth.jsx
import React, { useState } from "react";
import Login from "./Login";
import Register from "./Register";
import { AnimatePresence } from "framer-motion";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="max-w-md mx-auto px-6 py-10 bg-white shadow rounded-xl relative overflow-hidden">
      <AnimatePresence mode="wait">
        {isLogin ? (
          <Login key="login" onSwitch={() => setIsLogin(false)} />
        ) : (
          <Register key="register" onSwitch={() => setIsLogin(true)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Auth;