// src/components/user/UserAccount.jsx
import React, { useContext, useEffect, useState } from "react";
import api from "../../../api";
import { AuthContext } from "../../context/AuthContext";

export default function UserAccount() {
  const { isLoggedIn } = useContext(AuthContext);
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoggedIn) {
      setError("Oturum açılmamış");
      return;
    }
    api
      .get("/users/me")
      .then((res) => setUser(res.data))
      .catch((err) =>
        setError(err.response?.data?.message || "Profil alınamadı")
      );
  }, [isLoggedIn]);

  if (error) return <div className="text-red-500">{error}</div>;
  if (!user) return <div>Yükleniyor…</div>;

  return (
    <div className="p-6 bg-white rounded shadow-md space-y-2">
      <h2 className="text-xl font-bold">Hoş geldin, {user.firstName}!</h2>
      <p>
        <strong>Email:</strong> {user.email}
      </p>
      <p>
        <strong>Telefon:</strong> {user.phone || "-"}
      </p>
    </div>
  );
}
