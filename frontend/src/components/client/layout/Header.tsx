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

interface SettingGeneral {
  website_name?: string | null;
  logo?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  copyright?: string | null;
}

const Header: React.FC = () => {
  const [isProductMenuOpen, setIsProductMenuOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<number[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<SettingGeneral | null>(null);

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Auth + Cart
  const { user, isAuthenticated, logout } = useAuth();
  const { items } = useCart();
  const cartCount = items.length;

  // ==========================
  // 🔥 LOAD GENERAL SETTINGS
  // ==========================
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await http("GET", "/api/v1/client/settings/general");
        if (res?.success) {
          setSettings(res.data);
        }
      } catch (err) {
        console.error("Lỗi tải settings:", err);
      }
    };
    fetchSettings();
  }, []);

  // Giá trị fallback
  const websiteName = settings?.website_name || "FreshFruits";
  const logoUrl = settings?.logo || "https://i.imgur.com/8Jk3l7n.jpg"; // ảnh fallback nếu API không có logo

  // ==========================
  // 🔥 LOAD CATEGORIES
  // ==========================
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

  // Đóng menu khi click ra ngoài
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

  // Logout
  const handleLogout = async () => {
    try {
      await logout();
      setIsUserMenuOpen(false);
      navigate("/");
    } catch (err) {
      console.error("Lỗi khi đăng xuất:", err);
    }
  };

  // Toggle submenu
  const toggleExpand = (id: number) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // ==========================
  // 🔁 ĐỆ QUY MENU DANH MỤC
  // ==========================
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
                  onClick={(e) => {
                    e.preventDefault();
                    toggleExpand(child.id);
                  }}
                  className="p-1 text-gray-500 hover:text-green-600 transition"
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

  const renderCategoryMenu = (cats: Category[]) => (
    <div
      ref={menuRef}
      className="absolute top-full left-0 mt-0 bg-white rounded-lg shadow-lg py-3 border border-gray-100 z-50 w-72 overflow-y-auto max-h-[70vh]"
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
                  onClick={(e) => {
                    e.preventDefault();
                    toggleExpand(cat.id);
                  }}
                  className="p-1 text-gray-500 hover:text-green-600 transition"
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

  // ==========================
  // 🔥 UI HEADER
  // ==========================
  return (
    <header className="fixed top-0 w-full bg-white shadow-md z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* LOGO + WEBSITE NAME */}
          <Link to="/" className="flex items-center">
            <img
              src={logoUrl}
              alt="Logo"
              className="h-10 w-10 rounded-full mr-3 object-cover"
            />
            <span className="text-2xl font-bold text-green-600">
              {websiteName}
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

            {/* Menu sản phẩm */}
            <div
              className="relative py-2"
              onMouseEnter={() => setIsProductMenuOpen(true)}
              onMouseLeave={() => setIsProductMenuOpen(false)}
            >
              <Link
                to="/products"
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
              </Link>

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

          {/* Cart + User */}
          <div className="flex items-center space-x-4">
            {/* Cart */}
            <button
              onClick={() => {
                if (!isAuthenticated) return navigate("/login");
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

              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            {/* User menu */}
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
                        {user.fullName?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    )}
                  </div>
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
    </header>
  );
};

export default Header;
