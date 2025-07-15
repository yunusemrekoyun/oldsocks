// src/context/AuthContext.jsx
/* eslint-disable react-refresh/only-export-components */
// src/context/AuthContext.jsx
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
    if (!isLoggedIn) {
      setRole(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .get("/users/me", { skipAuthRefresh: true })
      .then((res) => {
        setRole(res.data.role);
      })
      .catch(() => {
        setRole(null);
        setIsLoggedIn(false);
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
