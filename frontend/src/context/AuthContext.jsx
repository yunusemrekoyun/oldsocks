// src/context/AuthContext.jsx
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect } from "react";
import api from "../../api";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(
    Boolean(localStorage.getItem("accessToken"))
  );
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(isLoggedIn);

  useEffect(() => {
    // Eğer login değilsek, hemen çık
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
      .catch((err) => {
        console.warn("[AuthContext] /users/me hatası:", err.response?.status);
        // 403/401 gelirse oturumu kapat
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
