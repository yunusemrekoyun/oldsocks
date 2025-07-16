import React, { useState, useRef, useEffect } from "react";

export default function Window({ title, children, onClose }) {
  const [isFull, setIsFull] = useState(false);
  const ref = useRef();

  // Dışarı tıklayınca kapatma
  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose?.();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        ref={ref}
        className={`
          bg-white rounded-xl shadow-xl border 
          flex flex-col transition-all duration-300
          ${isFull ? "w-full h-full p-6" : "w-full max-w-3xl max-h-[90vh] p-6"}
        `}
      >
        {/* Başlık alanı */}
        <div
          className="flex justify-between items-center mb-4 cursor-move"
          onClick={() => setIsFull((f) => !f)}
        >
          <h2 className="text-lg font-semibold">{title}</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-900 text-xl"
            >
              ✕
            </button>
          )}
        </div>

        {/* İçerik */}
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
}
