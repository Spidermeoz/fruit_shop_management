// src/components/layouts/DashboardHeader.tsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Moon, Sun, Bell, LogOut } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { http } from "../../services/http";

const DashboardHeader: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await http("POST", "/api/v1/admin/auth/logout");
    } catch {
      // bỏ qua lỗi logout phía server (token hết hạn, v.v…)
    } finally {
      // Xoá token/ thông tin auth ở client
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("currentUser");
      localStorage.removeItem("permissions");

      // Điều hướng về trang đăng nhập admin
      navigate("/admin/auth/login", { replace: true });
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm z-10">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left Section (Search - hiện tạm ẩn) */}
        <div className="flex items-center space-x-4" />

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Toggle Theme */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "light" ? (
              <Moon className="w-5 h-5 text-gray-600" />
            ) : (
              <Sun className="w-5 h-5 text-yellow-400" />
            )}
          </button>

          {/* Notification Bell */}
          <button
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 relative"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* Avatar + Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setOpen((s) => !s)}
              className="block rounded-full ring-1 ring-transparent hover:ring-gray-200 dark:hover:ring-gray-700 transition"
              aria-haspopup="menu"
              aria-expanded={open}
            >
              <img
                src="https://i.pravatar.cc/40"
                alt="User Avatar"
                className="w-10 h-10 rounded-full"
              />
            </button>

            {open && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-44 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black/5 focus:outline-none z-20"
              >
                {/* Bạn có thể thêm các mục khác (Hồ sơ, Cài đặt, ...) ở đây */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md"
                  role="menuitem"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
