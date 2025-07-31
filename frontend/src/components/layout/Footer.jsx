// src/components/Footer.jsx
import { Link } from "react-router-dom";
import { FaFacebookF, FaTwitter, FaPinterestP } from "react-icons/fa";

const Footer = () => (
  <footer className="bg-dark1 text-gray-300 pt-12">
    <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 px-6">
      {/* Hakkımızda */}
      <div>
        <h3 className="text-white font-semibold mb-4">OldSocks</h3>
        <p className="text-sm">
          Kaliteyi ve tarzı bir araya getiren OldSocks, her adımda konforu
          sunmayı hedefler. Siz de stilinize yön vermek istiyorsanız doğru
          yerdesiniz.
        </p>
      </div>

      {/* Hızlı Erişim */}
      <div>
        <h4 className="text-white font-semibold mb-3">Hızlı Erişim</h4>
        <ul className="space-y-2 text-sm">
          <li>
            <Link to="/">Ana Sayfa</Link>
          </li>
          <li>
            <Link to="/shop">Mağaza</Link>
          </li>
          <li>
            <Link to="/about">Hakkımızda</Link>
          </li>
          <li>
            <Link to="/blog">Blog</Link>
          </li>
        </ul>
      </div>

      {/* Sosyal Medya */}
      <div>
        <h4 className="text-white font-semibold mb-3">Bizi Takip Edin</h4>
        <div className="flex space-x-4">
          <FaFacebookF className="hover:text-purple-500 cursor-pointer" />
          <FaTwitter className="hover:text-purple-500 cursor-pointer" />
          <FaPinterestP className="hover:text-purple-500 cursor-pointer" />
        </div>
      </div>

      {/* İletişim */}
      <div>
        <h4 className="text-white font-semibold mb-3">İletişim</h4>
        <p className="text-sm">+90 262 279 385</p>
        <p className="text-sm">destek@oldsocks.com</p>
        <p className="text-sm">6512 Oakdale Greenway, İstanbul</p>
      </div>
    </div>

    <div className="border-t border-gray-800 mt-8 py-4 text-center text-sm">
      © {new Date().getFullYear()} OldSocks. Tüm hakları saklıdır.
    </div>
  </footer>
);

export default Footer;
