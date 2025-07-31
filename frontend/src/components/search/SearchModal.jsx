import React, { useEffect, useState, useRef } from "react";
import { FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import api from "../../../api";

export default function SearchModal({ open, onClose }) {
  const [allProducts, setAllProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  const [isVisible, setIsVisible] = useState(open);
  const [isClosing, setIsClosing] = useState(false);

  // Veriler çekilsin
  useEffect(() => {
    if (!open) return;
    api
      .get("/products")
      .then(({ data }) => setAllProducts(data))
      .catch(console.error);
    setQuery("");
  }, [open]);

  // Arama filtrelemesi
  useEffect(() => {
    const q = query.toLowerCase();
    if (!q) return setResults([]);
    setResults(allProducts.filter((p) => p.name.toLowerCase().includes(q)));
  }, [query, allProducts]);

  // Aç/Kapat kontrolü
  useEffect(() => {
    if (open) {
      setIsVisible(true);
      document.body.style.overflow = "hidden";
    } else {
      setIsClosing(true);
      setTimeout(() => {
        setIsVisible(false);
        setIsClosing(false);
        document.body.style.overflow = "";
      }, 200); // animasyon süresi
    }
  }, [open]);

  // Dışa tıklayınca kapansın
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        handleClose();
      }
    };
    if (isVisible) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isVisible]);

  const handleSelect = (id) => {
    handleClose();
    navigate(`/product-details/${id}`);
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
      onClose();
    }, 200);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity ${
        isClosing ? "fade-out" : "fade-in"
      }`}
    >
      <div
        ref={containerRef}
        className={`bg-white rounded-xl w-full max-w-lg mx-4 p-6 transform transition-transform duration-200 ${
          isClosing ? "scale-out" : "scale-in"
        }`}
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
                  onClick={() => handleSelect(p._id)}
                  className="py-3 px-4 hover:bg-gray-100 cursor-pointer flex items-center justify-between rounded transition group"
                >
                  <div className="flex items-center space-x-4">
                    {p.images?.[0] && (
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        className="h-12 w-12 object-cover rounded shadow"
                      />
                    )}
                    <div>
                      <div className="text-dark1 font-medium group-hover:underline">
                        {p.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {p.description?.slice(0, 50)}...
                      </div>
                    </div>
                  </div>
                  <div className="text-right space-y-1 min-w-[80px]">
                    <div className="text-dark1 font-semibold">
                      ₺{p.price.toFixed(2)}
                    </div>
                    <div className="text-yellow-400 text-xs">★★★★★</div>
                  </div>
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

      {/* Animasyonlar */}
      <style>{`
        .fade-in {
          animation: fadeIn 0.2s ease-out forwards;
        }
        .fade-out {
          animation: fadeOut 0.2s ease-in forwards;
        }
        .scale-in {
          animation: scaleIn 0.2s ease-out forwards;
        }
        .scale-out {
          animation: scaleOut 0.2s ease-in forwards;
        }

        @keyframes fadeIn {
          from { opacity: 0 }
          to { opacity: 1 }
        }
        @keyframes fadeOut {
          from { opacity: 1 }
          to { opacity: 0 }
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0 }
          to { transform: scale(1); opacity: 1 }
        }
        @keyframes scaleOut {
          from { transform: scale(1); opacity: 1 }
          to { transform: scale(0.95); opacity: 0 }
        }
      `}</style>
    </div>
  );
}
