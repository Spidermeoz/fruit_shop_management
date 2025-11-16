import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { http } from "../../../services/http";
import { buildClientCategoryTree } from "../../../utils/categoryTreeForClient";
import { useAuth } from "../../../context/AuthContext";
import { useCart } from "../../../context/CartContext";

interface Category {
  id: number;
  title: string;
  parentId?: number | null;
  slug?: string;
  children?: Category[];
}

const Header: React.FC = () => {
  const [isProductMenuOpen, setIsProductMenuOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<number[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // ✅ Lấy từ AuthContext
  const { user, isAuthenticated, logout } = useAuth();
  const { items } = useCart();
  const cartCount = items.length;

  // ✅ Lấy danh mục sản phẩm từ backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const json = await http("GET", "/api/v1/client/categories");
        if (json?.success && Array.isArray(json.data)) {
          const tree = buildClientCategoryTree(json.data);
          setCategories(tree);
        }
      } catch (err) {
        console.error("Lỗi tải danh mục:", err);
      }
    };
    fetchCategories();
  }, []);

  // ✅ Đóng menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsProductMenuOpen(false);
        setExpandedIds([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Xử lý logout
  const handleLogout = async () => {
    try {
      await logout();
      setIsUserMenuOpen(false);
      navigate("/");
    } catch (err) {
      console.error("Lỗi khi đăng xuất:", err);
    }
  };

  // 🧩 Toggle submenu
  const toggleExpand = (id: number) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // 🧩 Đệ quy hiển thị danh mục con
  const renderSubMenu = (children: Category[], depth = 1) => (
    <ul className="pl-4 border-l border-gray-200 ml-2">
      {children.map((child) => {
        const isExpanded = expandedIds.includes(child.id);
        const hasChildren = child.children && child.children.length > 0;
        return (
          <li key={child.id} className="py-1">
            <div className="flex justify-between items-center">
              <Link
                to={`/products?category=${child.slug || child.id}`}
                className="block text-gray-700 hover:text-green-600 transition"
              >
                {child.title}
              </Link>
              {hasChildren && (
                <button
                  onClick={() => toggleExpand(child.id)}
                  className="p-1 text-gray-500 hover:text-green-600 transition"
                  title={isExpanded ? "Thu gọn" : "Mở rộng"}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`w-4 h-4 transform transition-transform ${
                      isExpanded ? "rotate-90" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              )}
            </div>

            {hasChildren &&
              isExpanded &&
              renderSubMenu(child.children!, depth + 1)}
          </li>
        );
      })}
    </ul>
  );

  // 🧩 Menu danh mục cấp 1
  const renderCategoryMenu = (cats: Category[]) => (
    <div
      ref={menuRef}
      className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg py-3 border border-gray-100 z-50 w-72 overflow-y-auto max-h-[70vh]"
      style={{ animation: "fadeIn 0.15s ease-in-out" }}
    >
      {cats.map((cat) => {
        const isExpanded = expandedIds.includes(cat.id);
        const hasChildren = cat.children && cat.children.length > 0;

        return (
          <div key={cat.id} className="px-4 py-2 hover:bg-green-50 rounded-md">
            <div className="flex justify-between items-center">
              <Link
                to={`/products?category=${cat.slug || cat.id}`}
                className="text-gray-800 font-medium hover:text-green-700 transition"
              >
                {cat.title}
              </Link>
              {hasChildren && (
                <button
                  onClick={() => toggleExpand(cat.id)}
                  className="p-1 text-gray-500 hover:text-green-600 transition"
                  title={isExpanded ? "Thu gọn" : "Mở rộng"}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`w-4 h-4 transform transition-transform ${
                      isExpanded ? "rotate-90" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              )}
            </div>

            {hasChildren && isExpanded && renderSubMenu(cat.children!)}
          </div>
        );
      })}
    </div>
  );

  return (
    <header className="fixed top-0 w-full bg-white shadow-md z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img
              src="https://i.imgur.com/8Jk3l7n.jpg"
              alt="Logo"
              className="h-10 w-10 rounded-full mr-3"
            />
            <span className="text-2xl font-bold text-green-600">
              FreshFruits
            </span>
          </Link>

          {/* Menu chính */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className="text-gray-700 hover:text-green-600 transition font-medium"
            >
              Trang chủ
            </Link>

            <div className="relative">
              <button
                onClick={() => setIsProductMenuOpen((prev) => !prev)}
                className="text-gray-700 hover:text-green-600 transition font-medium flex items-center"
              >
                Sản phẩm
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-4 w-4 ml-1 transform transition-transform ${
                    isProductMenuOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {isProductMenuOpen &&
                categories.length > 0 &&
                renderCategoryMenu(categories)}
            </div>

            <Link
              to="/about"
              className="text-gray-700 hover:text-green-600 transition font-medium"
            >
              Giới thiệu
            </Link>
            <Link
              to="/contact"
              className="text-gray-700 hover:text-green-600 transition font-medium"
            >
              Liên hệ
            </Link>
          </nav>

          {/* Hành động */}
          <div className="flex items-center space-x-4">
            {/* Giỏ hàng */}
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  navigate("/login");
                  return;
                }
                navigate("/cart");
              }}
              className="relative p-2 text-gray-700 hover:text-green-600 transition"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>

              {/* 🛒 Hiển thị badge nếu có item */}
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
            {/* Người dùng */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-green-600 flex items-center justify-center">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.fullName || "User Avatar"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-sm font-medium">
                        {user.fullName
                          ? user.fullName.charAt(0).toUpperCase()
                          : "U"}
                      </span>
                    )}
                  </div>

                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-gray-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-gray-700 hover:bg-green-50 transition"
                    >
                      Tài khoản của tôi
                    </Link>
                    <Link
                      to="/orders"
                      className="block px-4 py-2 text-gray-700 hover:bg-green-50 transition"
                    >
                      Đơn hàng của tôi
                    </Link>
                    <hr className="my-2" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-green-50 transition"
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-green-600 hover:text-green-700 font-medium transition"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-full font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </header>
  );
};

export default Header;
