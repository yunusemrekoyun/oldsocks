import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const STORAGE_KEY = "cookieConsent"; // "accepted"

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const v = localStorage.getItem(STORAGE_KEY);
    if (!v) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[1000] pointer-events-none">
      <div className="relative w-full">
        <div
          className="
            pointer-events-auto
            mx-auto
            mb-6
            max-w-[700px]
            w-[calc(100%-24px)]
            rounded-2xl
            border
            border-gray-200
            bg-white/70
            backdrop-blur
            shadow-xl
          "
        >
          <div className="p-4 sm:p-5">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900">
              Çerez Kullanımı
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-gray-700 leading-5">
              Sitemiz; oturum (giriş), sepet ve ödeme akışları için{" "}
              <b>zorunlu çerezler</b> kullanır. Detaylar için{" "}
              <Link
                to="/cookies"
                className="text-black underline underline-offset-2"
              >
                Çerez Politikası
              </Link>
              ’nı inceleyebilirsiniz.
            </p>

            <div className="mt-4 flex justify-end">
              <button
                onClick={accept}
                className="px-3 py-2 text-sm rounded-lg bg-black text-white hover:bg-gray-800"
              >
                Tamam, anladım
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
