// src/context/AuthContext.jsx
/* eslint-disable react-refresh/only-export-components */

import React, { createContext, useState, useEffect, useContext } from "react";
import api from "../../api";

export const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(
    Boolean(localStorage.getItem("accessToken"))
  );
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(isLoggedIn);

  useEffect(() => {
    if (!isLoggedIn) {
      setRole(null);
      setLoading(false);
      localStorage.removeItem("accessToken");
      return;
    }

    setLoading(true);
    api
      .get("/users/me")
      .then((res) => {
        setRole(res.data.role);
      })
      .catch(() => {
        // 401/403 gelirse oturumu kapat
        setRole(null);
        setIsLoggedIn(false);
        localStorage.removeItem("accessToken");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isLoggedIn]);

  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn, role, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
