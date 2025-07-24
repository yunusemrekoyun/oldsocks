// src/components/SearchModal.jsx
import React, { useEffect, useState, useRef } from "react";
import { FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom"; // ← EKLENDİ
import api from "../../../api";

export default function SearchModal({ open, onClose }) {
  const [allProducts, setAllProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const containerRef = useRef(null);
  const navigate = useNavigate(); // ← EKLENDİ

  // Ürünleri bir kez çek
  useEffect(() => {
    if (!open) return;
    api
      .get("/products")
      .then(({ data }) => setAllProducts(data))
      .catch(console.error);
    setQuery("");
  }, [open]);

  // Her query değişiminde filtrele
  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }
    const q = query.toLowerCase();
    setResults(allProducts.filter((p) => p.name.toLowerCase().includes(q)));
  }, [query, allProducts]);

  // Modal dışına tıklayınca kapa
  useEffect(() => {
    function handler(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose();
      }
    }
    if (open) {
      document.addEventListener("mousedown", handler);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("mousedown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleSelect = (id) => {
    onClose(); // modal’ı kapat
    navigate(`/product-details/${id}`); // detay sayfasına git
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity"
      style={{ animation: "fadeIn 200ms ease-out" }}
    >
      <div
        ref={containerRef}
        className="bg-white rounded-xl w-full max-w-lg mx-4 p-6 transform transition-all duration-300 scale-100"
        style={{ animation: "scaleIn 200ms ease-out" }}
      >
        <div className="flex items-center mb-4 border-b pb-2">
          <FaSearch className="text-gray-500 mr-2" />
          <input
            autoFocus
            type="text"
            placeholder="Ürün ara..."
            className="w-full outline-none text-lg"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="max-h-64 overflow-auto">
          {query ? (
            results.length ? (
              results.map((p) => (
                <div
                  key={p._id}
                  className="py-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                  onClick={() => handleSelect(p._id)} // ← EKLENDİ
                >
                  <span>{p.name}</span>
                  {/* Thumbnail olarak ilk resim */}
                  {p.images?.[0] && (
                    <img
                      src={p.images[0]}
                      alt={p.name}
                      className="h-8 w-8 object-cover rounded"
                    />
                  )}
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-4">
                Sonuç bulunamadı.
              </div>
            )
          ) : (
            <div className="text-gray-500 text-center py-4">
              Herhangi bir ürün adı yazın.
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0 }
          to   { opacity: 1 }
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0 }
          to   { transform: scale(1); opacity: 1 }
        }
      `}</style>
    </div>
  );
}
