import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingBag,
  Menu,
  X,
  FolderTree,
  type LucideIcon,
} from "lucide-react";

// 🔹 Kiểu dữ liệu cho từng mục sidebar
interface SidebarItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

// 🔹 Danh sách menu sidebar
const sidebarItems: SidebarItem[] = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Products", href: "/admin/products", icon: ShoppingBag },
  { name: "Categories", href: "/admin/product-category", icon: FolderTree },
];

const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div
      className={`${
        isCollapsed ? "w-20" : "w-64"
      } bg-white dark:bg-gray-800 shadow-md flex flex-col transition-all duration-300 ease-in-out`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
        {!isCollapsed && (
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            MyApp
          </h1>
        )}
        <button
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          {isCollapsed ? (
            <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          ) : (
            <X className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {sidebarItems.map((item) => {
          const Icon = item.icon;

          // ✅ Check active route
          const isActive =
            location.pathname === item.href ||
            location.pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-blue-500 text-white"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <Icon className="w-6 h-6" />
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;
