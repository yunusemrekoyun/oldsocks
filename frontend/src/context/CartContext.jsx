// src/context/CartProvider.jsx
import React, { useState, useEffect } from "react";
import { CartContext } from "./CartContextObject";

const STORAGE_KEY = "cartItems";
const CAMPAIGN_STORAGE_KEY = "selectedCartCampaignId";

export default function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [selectedCampaignId, setSelectedCampaignId] = useState(() => {
    try {
      const stored = localStorage.getItem(CAMPAIGN_STORAGE_KEY);
      return stored ? String(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      return;
    }
  }, [items]);

  useEffect(() => {
    try {
      if (selectedCampaignId) {
        localStorage.setItem(CAMPAIGN_STORAGE_KEY, selectedCampaignId);
      } else {
        localStorage.removeItem(CAMPAIGN_STORAGE_KEY);
      }
    } catch {
      return;
    }
  }, [selectedCampaignId]);

  const addToCart = (product) => {
    setItems((prev) => {
      const existing = prev.find(
        (item) => item.id === product.id && item.size === product.size
      );
      if (existing) {
        return prev.map((item) =>
          item.id === product.id && item.size === product.size
            ? { ...item, qty: item.qty + product.qty }
            : item
        );
      } else {
        return [...prev, product];
      }
    });
  };

  const updateQty = (id, size, qty) => {
    const normalizedQty = Math.max(1, Math.floor(Number(qty || 1)));
    setItems((prev) =>
      prev.map((item) =>
        item.id === id && item.size === size
          ? { ...item, qty: normalizedQty }
          : item
      )
    );
  };

  const removeFromCart = (id, size) => {
    setItems((prev) =>
      prev.filter((item) => !(item.id === id && item.size === size))
    );
  };

  const clearCart = () => {
    setItems([]);
    setSelectedCampaignId(null);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQty,
        removeFromCart,
        clearCart,
        selectedCampaignId,
        setSelectedCampaignId,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
