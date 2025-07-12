// src/components/Footer.jsx
import { Link } from "react-router-dom";
import { FaFacebookF, FaTwitter, FaPinterestP } from "react-icons/fa";

const Footer = () => (
  <footer className="bg-gray-900 text-gray-300 pt-12">
    <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 px-6">
      {/* Hakkımızda */}
      <div>
        <h3 className="text-white font-semibold mb-4">Shion House</h3>
        <p className="text-sm">
          Suoeriorize veritatis error sit nemo consectetur voluptas. Quis autem
          vel eum iure reprehenderit qui in ea voluptate velit esse.
        </p>
      </div>

      {/* Quick Links */}
      <div>
        <h4 className="text-white font-semibold mb-3">Quick links</h4>
        <ul className="space-y-2 text-sm">
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/shop">Shop</Link>
          </li>
          <li>
            <Link to="/about">About</Link>
          </li>
          <li>
            <Link to="/blog">Blog</Link>
          </li>
        </ul>
      </div>

      {/* Social */}
      <div>
        <h4 className="text-white font-semibold mb-3">Follow us</h4>
        <div className="flex space-x-4">
          <FaFacebookF className="hover:text-purple-500 cursor-pointer" />
          <FaTwitter className="hover:text-purple-500 cursor-pointer" />
          <FaPinterestP className="hover:text-purple-500 cursor-pointer" />
        </div>
      </div>

      {/* İletişim */}
      <div>
        <h4 className="text-white font-semibold mb-3">Get in touch</h4>
        <p className="text-sm">+90 262 279 385</p>
        <p className="text-sm">demo@site.com</p>
        <p className="text-sm">6512 Oakdale Greenway, NYC</p>
      </div>
    </div>

    <div className="border-t border-gray-800 mt-8 py-4 text-center text-sm">
     
    </div>
  </footer>
);

export default Footer;
