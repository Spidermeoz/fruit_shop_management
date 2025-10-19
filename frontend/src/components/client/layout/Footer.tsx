import React from "react";
import { Link } from "react-router-dom";

const Footer: React.FC = () => {
  return (
    <footer className="bg-green-800 text-white mt-12 py-8">
      <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
        {/* Cột 1 */}
        <div>
          <h3 className="text-xl font-semibold mb-3">🌿 FreshFarm</h3>
          <p className="text-sm text-gray-300">
            Mang đến cho bạn rau củ quả tươi sạch, an toàn và chất lượng mỗi ngày.
          </p>
        </div>

        {/* Cột 2 */}
        <div>
          <h4 className="text-lg font-semibold mb-3">Liên kết nhanh</h4>
          <ul className="space-y-2 text-gray-300">
            <li>
              <Link to="/" className="hover:text-yellow-300">
                Trang chủ
              </Link>
            </li>
            <li>
              <Link to="/shop" className="hover:text-yellow-300">
                Sản phẩm
              </Link>
            </li>
            <li>
              <Link to="/cart" className="hover:text-yellow-300">
                Giỏ hàng
              </Link>
            </li>
          </ul>
        </div>

        {/* Cột 3 */}
        <div>
          <h4 className="text-lg font-semibold mb-3">Liên hệ</h4>
          <p className="text-gray-300 text-sm">
            📍 Đại học Thăng Long 
            📞 0123 456 789  
            ✉️ test@thanglong.edu.vn
          </p>
        </div>
      </div>

      <div className="mt-8 text-center text-gray-400 text-sm border-t border-green-700 pt-4">
        © 2025 FreshFarm. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
