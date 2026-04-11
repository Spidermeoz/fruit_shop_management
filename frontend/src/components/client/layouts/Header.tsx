import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { http } from "../../../services/http";
import { buildClientCategoryTree } from "../../../utils/categoryTreeForClient";
import { getClientPostCategories } from "../../../services/api/postsClient";
import { useAuth } from "../../../context/AuthContext";
import { useCart } from "../../../context/CartContext";

interface Category {
  id: number;
  title: string;
  parentId?: number | null;
  slug?: string;
  children?: Category[];
}

interface PostCategory {
  id: number;
  title: string;
  parent_id?: number | null;
  parentId?: number | null;
  slug?: string;
  status?: string;
  position?: number | null;
  children?: PostCategory[];
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

  const [isPostMenuOpen, setIsPostMenuOpen] = useState(false);
  const [expandedPostIds, setExpandedPostIds] = useState<number[]>([]);
  const [postCategories, setPostCategories] = useState<PostCategory[]>([]);

  const [settings, setSettings] = useState<SettingGeneral | null>(null);

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const productMenuRef = useRef<HTMLDivElement>(null);
  const postMenuRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    const fetchPostCategories = async () => {
      try {
        const res = await getClientPostCategories();
        if (res?.success && Array.isArray(res.data)) {
          const tree = buildClientCategoryTree(res.data as any[]);
          setPostCategories(tree as PostCategory[]);
        }
      } catch (err) {
        console.error("Lỗi tải danh mục bài viết:", err);
      }
    };

    fetchPostCategories();
  }, []);

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      if (productMenuRef.current && !productMenuRef.current.contains(target)) {
        setIsProductMenuOpen(false);
        setExpandedIds([]);
      }

      if (postMenuRef.current && !postMenuRef.current.contains(target)) {
        setIsPostMenuOpen(false);
        setExpandedPostIds([]);
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
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const togglePostExpand = (id: number) => {
    setExpandedPostIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  // ==========================
  // ĐỆ QUY MENU DANH MỤC
  // ==========================
  const renderSubMenu = (children: Category[], depth = 1) => (
    <ul className="pl-4 border-l-2 border-slate-100 ml-3 mt-1 space-y-1">
      {children.map((child) => {
        const isExpanded = expandedIds.includes(child.id);
        const hasChildren = child.children && child.children.length > 0;
        return (
          <li key={child.id} className="py-1">
            <div className="flex justify-between items-center group/item rounded-xl px-2 py-1.5 transition-colors hover:bg-slate-50">
              <Link
                to={`/products?category=${child.slug || child.id}`}
                className="block flex-1 text-sm font-semibold text-slate-500 hover:text-green-600 transition-colors"
              >
                {child.title}
              </Link>

              {hasChildren && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    toggleExpand(child.id);
                  }}
                  className="p-1 text-slate-400 hover:text-green-600 transition-colors bg-white rounded-md shadow-sm border border-slate-100 opacity-50 hover:opacity-100"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`w-3.5 h-3.5 transform transition-transform duration-300 ${
                      isExpanded ? "rotate-90" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
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
      ref={productMenuRef}
      className="absolute top-full left-0 mt-2 bg-white rounded-[1.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.08)] py-3 border border-slate-50 z-50 w-72 overflow-y-auto max-h-[70vh] custom-scrollbar"
    >
      <div className="px-2">
        {cats.map((cat) => {
          const isExpanded = expandedIds.includes(cat.id);
          const hasChildren = cat.children && cat.children.length > 0;

          return (
            <div key={cat.id} className="mb-1">
              <div className="flex justify-between items-center px-4 py-2.5 hover:bg-green-50/50 rounded-2xl transition-colors group/parent">
                <Link
                  to={`/products?category=${cat.slug || cat.id}`}
                  className="text-slate-700 font-bold hover:text-green-600 transition-colors flex-1"
                >
                  {cat.title}
                </Link>

                {hasChildren && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      toggleExpand(cat.id);
                    }}
                    className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-white rounded-lg transition-all"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`w-4 h-4 transform transition-transform duration-300 ${
                        isExpanded ? "rotate-90 text-green-600" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                )}
              </div>

              {hasChildren && isExpanded && (
                <div className="pb-2">{renderSubMenu(cat.children!)}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderPostSubMenu = (children: PostCategory[]) => (
    <ul className="ml-3 mt-1 space-y-1 border-l-2 border-slate-100 pl-4">
      {children.map((child) => {
        const isExpanded = expandedPostIds.includes(child.id);
        const hasChildren = child.children && child.children.length > 0;

        return (
          <li key={child.id} className="py-1">
            <div className="group/item flex items-center justify-between rounded-xl px-2 py-1.5 transition-colors hover:bg-slate-50">
              <Link
                to={`/posts?category=${child.slug || child.id}`}
                className="block flex-1 text-sm font-semibold text-slate-500 transition-colors hover:text-green-600"
              >
                {child.title}
              </Link>

              {hasChildren && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    togglePostExpand(child.id);
                  }}
                  className="rounded-md border border-slate-100 bg-white p-1 text-slate-400 opacity-50 shadow-sm transition-colors hover:text-green-600 hover:opacity-100"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-3.5 w-3.5 transform transition-transform duration-300 ${
                      isExpanded ? "rotate-90" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              )}
            </div>

            {hasChildren && isExpanded && renderPostSubMenu(child.children!)}
          </li>
        );
      })}
    </ul>
  );

  const renderPostCategoryMenu = (cats: PostCategory[]) => (
    <div
      ref={postMenuRef}
      className="custom-scrollbar absolute left-0 top-full z-50 mt-2 max-h-[70vh] w-72 overflow-y-auto rounded-[1.5rem] border border-slate-50 bg-white py-3 shadow-[0_20px_60px_rgba(0,0,0,0.08)]"
    >
      <div className="px-2">
        {cats.map((cat) => {
          const isExpanded = expandedPostIds.includes(cat.id);
          const hasChildren = cat.children && cat.children.length > 0;

          return (
            <div key={cat.id} className="mb-1">
              <div className="group/parent flex items-center justify-between rounded-2xl px-4 py-2.5 transition-colors hover:bg-green-50/50">
                <Link
                  to={`/posts?category=${cat.slug || cat.id}`}
                  className="flex-1 font-bold text-slate-700 transition-colors hover:text-green-600"
                >
                  {cat.title}
                </Link>

                {hasChildren && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      togglePostExpand(cat.id);
                    }}
                    className="rounded-lg p-1.5 text-slate-400 transition-all hover:bg-white hover:text-green-600"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-4 w-4 transform transition-transform duration-300 ${
                        isExpanded ? "rotate-90 text-green-600" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                )}
              </div>

              {hasChildren && isExpanded && (
                <div className="pb-2">{renderPostSubMenu(cat.children!)}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // ==========================
  // 🔥 UI HEADER
  // ==========================
  return (
    <header className="fixed top-0 w-full bg-white/90 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.03)] border-b border-slate-100 z-50 transition-all duration-300">
      <div className="container mx-auto px-4 lg:px-8 py-3 lg:py-4">
        <div className="flex justify-between items-center">
          {/* LOGO + WEBSITE NAME */}
          <Link to="/" className="flex items-center group">
            <img
              src={logoUrl}
              alt="Logo"
              className="h-10 w-10 md:h-12 md:w-12 rounded-2xl mr-3 object-cover shadow-sm ring-1 ring-slate-100 group-hover:scale-105 transition-transform duration-300"
            />
            <span className="text-xl md:text-2xl font-black tracking-tight text-slate-900 group-hover:text-green-600 transition-colors">
              {websiteName}
            </span>
          </Link>

          {/* Menu chính (Desktop) */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              to="/"
              className="px-4 py-2 rounded-full text-slate-600 hover:text-green-600 hover:bg-green-50 font-bold transition-all"
            >
              Trang chủ
            </Link>

            {/* Menu sản phẩm */}
            <div
              className="relative"
              onMouseEnter={() => setIsProductMenuOpen(true)}
              onMouseLeave={() => setIsProductMenuOpen(false)}
            >
              <Link
                to="/products"
                className="px-4 py-2 rounded-full text-slate-600 hover:text-green-600 hover:bg-green-50 font-bold transition-all flex items-center gap-1"
              >
                Sản phẩm
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-4 w-4 transform transition-transform duration-300 ${
                    isProductMenuOpen
                      ? "rotate-180 text-green-600"
                      : "text-slate-400"
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </Link>

              {/* Vùng đệm trong suốt để chuột không bị trượt khi di chuyển xuống menu */}
              <div className="absolute top-full left-0 w-full h-4 bg-transparent"></div>

              {isProductMenuOpen &&
                categories.length > 0 &&
                renderCategoryMenu(categories)}
            </div>

            <div
              className="relative"
              onMouseEnter={() => setIsPostMenuOpen(true)}
              onMouseLeave={() => setIsPostMenuOpen(false)}
            >
              <Link
                to="/posts"
                className="flex items-center gap-1 rounded-full px-4 py-2 font-bold text-slate-600 transition-all hover:bg-green-50 hover:text-green-600"
              >
                Cẩm nang
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-4 w-4 transform transition-transform duration-300 ${
                    isPostMenuOpen
                      ? "rotate-180 text-green-600"
                      : "text-slate-400"
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </Link>

              <div className="absolute top-full left-0 h-4 w-full bg-transparent"></div>

              {isPostMenuOpen &&
                postCategories.length > 0 &&
                renderPostCategoryMenu(postCategories)}
            </div>

            <Link
              to="/about"
              className="px-4 py-2 rounded-full text-slate-600 hover:text-green-600 hover:bg-green-50 font-bold transition-all"
            >
              Giới thiệu
            </Link>
            <Link
              to="/contact"
              className="px-4 py-2 rounded-full text-slate-600 hover:text-green-600 hover:bg-green-50 font-bold transition-all"
            >
              Liên hệ
            </Link>
          </nav>

          {/* Cart + User Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Cart Button */}
            <button
              id="header-cart-button"
              onClick={() => {
                if (!isAuthenticated) return navigate("/login");
                navigate("/cart");
              }}
              className="relative p-2.5 rounded-full text-slate-700 bg-slate-50 hover:bg-green-50 hover:text-green-600 transition-colors border border-slate-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 md:h-6 md:w-6"
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
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white shadow-sm">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </button>

            {/* Separator */}
            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

            {/* User Area */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1.5 pr-3 rounded-full hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                >
                  <div className="w-9 h-9 md:w-10 md:h-10 rounded-full overflow-hidden bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-inner">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.full_name || "Avatar"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-sm font-bold">
                        {user.full_name?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    )}
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-slate-400 hidden sm:block"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* User Dropdown */}
                {isUserMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsUserMenuOpen(false)}
                    ></div>
                    <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.1)] border border-slate-50 py-2 z-50">
                      <div className="px-4 py-3 border-b border-slate-50 mb-2">
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {user.full_name}
                        </p>
                        <p className="text-xs font-medium text-slate-500 truncate">
                          {user.email}
                        </p>
                      </div>

                      <div className="px-2 space-y-1">
                        <Link
                          to="/profile"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-green-50 hover:text-green-700 rounded-xl transition-colors"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                          Tài khoản của tôi
                        </Link>
                        <Link
                          to="/orders"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-green-50 hover:text-green-700 rounded-xl transition-colors"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                            />
                          </svg>
                          Đơn hàng của tôi
                        </Link>
                      </div>

                      <div className="px-2 mt-2 pt-2 border-t border-slate-50">
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
                          </svg>
                          Đăng xuất
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-4 py-2.5 text-sm font-bold text-slate-700 hover:text-green-600 transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-green-700 hover:shadow-[0_10px_20px_rgba(34,197,94,0.2)] transition-all duration-300 active:scale-95"
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
