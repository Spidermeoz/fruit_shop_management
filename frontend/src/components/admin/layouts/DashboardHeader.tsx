import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Moon, Sun, Bell, LogOut, ChevronDown, GitBranch } from "lucide-react";
import { useTheme } from "../../../context/ThemeContext";
import { useAuth } from "../../../context/AuthContextAdmin";

const DashboardHeader: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  const {
    user,
    branches,
    currentBranchId,
    currentBranch,
    setCurrentBranchId,
    logout,
  } = useAuth();

  const [open, setOpen] = useState(false);

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
    await logout();
    navigate("/admin/auth/login", { replace: true });
  };

  const userAvatar = useMemo(() => {
    if (user?.avatar) return user.avatar;
    const seed = user?.full_name || user?.email || "Admin User";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      seed,
    )}&background=0D8ABC&color=fff`;
  }, [user]);

  // Kiểm tra xem có cần disable select hay không (nếu số lượng branch <= 1)
  const isBranchSelectDisabled = branches.length <= 1;

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm z-10">
      <div className="flex items-center justify-between px-6 py-4 gap-4">
        {/* Vùng bên trái trống (có thể chèn Logo/Menu toggle sau) */}
        <div className="flex items-center space-x-4" />

        <div className="flex items-center space-x-4">
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

          <button
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 relative"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setOpen((s) => !s)}
              className="flex items-center gap-2 rounded-full ring-1 ring-transparent hover:ring-gray-200 dark:hover:ring-gray-700 transition pl-1 pr-2 py-1"
              aria-haspopup="menu"
              aria-expanded={open}
            >
              <img
                src={userAvatar}
                alt="User Avatar"
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="hidden lg:block text-left">
                <p className="text-sm font-medium text-gray-800 dark:text-white leading-tight">
                  {user?.full_name || user?.email || "Admin"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                  {currentBranch?.name || "Chưa chọn chi nhánh"}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400 hidden lg:block" />
            </button>

            {open && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-64 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black/5 focus:outline-none z-20"
              >
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-800 dark:text-white">
                    {user?.full_name || "Admin"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 break-all">
                    {user?.email}
                  </p>
                </div>

                {branches.length > 0 && (
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                      Chi nhánh hiện tại
                    </p>
                    <div className="flex items-center gap-2">
                      <GitBranch className="w-4 h-4 text-gray-400" />
                      <select
                        value={currentBranchId ?? ""}
                        onChange={(e) => {
                          const next = e.target.value
                            ? Number(e.target.value)
                            : null;
                          setCurrentBranchId(next);
                        }}
                        disabled={isBranchSelectDisabled}
                        className={`w-full rounded-md border border-gray-300 dark:border-gray-600 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isBranchSelectDisabled
                            ? "bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                            : "bg-white dark:bg-gray-700 text-gray-800 dark:text-white cursor-pointer"
                        }`}
                      >
                        {branches.map((branch) => (
                          <option
                            key={branch.id}
                            value={branch.id}
                            className="text-gray-800 dark:text-white"
                          >
                            {branch.name || `Branch #${branch.id}`}
                            {branch.is_primary ? " (Mặc định)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="p-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                    role="menuitem"
                  >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
