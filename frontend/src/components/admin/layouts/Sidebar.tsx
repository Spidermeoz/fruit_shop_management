import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  FolderTree,
  LayoutDashboard,
  MapPinned,
  Menu,
  Receipt,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Tags,
  type LucideIcon,
  Users,
  X,
  Store,
  Package2,
  ScrollText,
  PanelsTopLeft,
  Users2,
  Truck,
  Clock3,
  Link2,
  CalendarDays,
} from "lucide-react";
import Can from "../../../auth/Can";

interface SidebarItem {
  name: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean; // Thêm thuộc tính exact
  permission?: {
    module: string;
    action: string;
  };
}

const productChildren: SidebarItem[] = [
  {
    name: "Products",
    href: "/admin/products",
    icon: ShoppingBag,
    exact: true, // Thêm exact: true
    permission: { module: "product", action: "view" },
  },
  {
    name: "Origins",
    href: "/admin/products/origins",
    icon: MapPinned,
    permission: { module: "origin", action: "view" },
  },
  {
    name: "Tags",
    href: "/admin/products/tags",
    icon: Tags,
    permission: { module: "product_tag", action: "view" },
  },
  {
    name: "Categories",
    href: "/admin/products/categories",
    icon: FolderTree,
    permission: { module: "product_category", action: "view" },
  },
];

const inventoryChildren: SidebarItem[] = [
  {
    name: "Inventory",
    href: "/admin/inventory",
    icon: Package2,
    exact: true, // Thêm exact: true
    permission: { module: "inventory", action: "view" },
  },
  {
    name: "History",
    href: "/admin/inventory/history",
    icon: ScrollText,
    permission: { module: "inventory", action: "view" },
  },
];

const shippingChildren: SidebarItem[] = [
  {
    name: "Dashboard",
    href: "/admin/shipping",
    icon: LayoutDashboard,
    exact: true, // Thêm exact: true thay vì hardcode trong renderChildItem
  },
  {
    name: "Zones",
    href: "/admin/shipping/zones",
    icon: MapPinned,
    permission: { module: "shipping_zone", action: "view" },
  },
  {
    name: "Coverage",
    href: "/admin/shipping/service-areas",
    icon: Truck,
    permission: { module: "branch_service_area", action: "view" },
  },
  {
    name: "Slots",
    href: "/admin/shipping/delivery-slots",
    icon: Clock3,
    permission: { module: "delivery_time_slot", action: "view" },
  },
  {
    name: "Branch Slots",
    href: "/admin/shipping/branch-delivery-slots",
    icon: Link2,
    permission: { module: "branch_delivery_time_slot", action: "view" },
  },
  {
    name: "Capacity",
    href: "/admin/shipping/branch-delivery-slot-capacities",
    icon: CalendarDays,
    permission: { module: "branch_delivery_slot_capacity", action: "view" },
  },
];

const userChildren: SidebarItem[] = [
  {
    name: "Hub",
    href: "/admin/users/hub",
    icon: PanelsTopLeft,
    permission: { module: "user", action: "view" },
  },
  {
    name: "Users",
    href: "/admin/users",
    icon: Users2,
    exact: true,
    permission: { module: "user", action: "view" },
  },
];

const sidebarItems: SidebarItem[] = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  {
    name: "Branches",
    href: "/admin/branches",
    icon: Store,
    permission: { module: "branch", action: "view" },
  },
  {
    name: "Orders",
    href: "/admin/orders",
    icon: Receipt,
    permission: { module: "order", action: "view" },
  },
  {
    name: "Roles",
    href: "/admin/roles",
    icon: ShieldCheck,
    permission: { module: "role", action: "view" },
  },
  {
    name: "Settings",
    href: "/admin/settings/general",
    icon: Settings,
    permission: { module: "setting", action: "update" },
  },
];

const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  const isProductsSectionActive =
    location.pathname === "/admin/products" ||
    location.pathname.startsWith("/admin/products/");

  const isInventorySectionActive =
    location.pathname === "/admin/inventory" ||
    location.pathname.startsWith("/admin/inventory/");

  const isShippingSectionActive =
    location.pathname === "/admin/shipping" ||
    location.pathname.startsWith("/admin/shipping/");

  const isUsersSectionActive =
    location.pathname === "/admin/users" ||
    location.pathname.startsWith("/admin/users/");

  const [isProductsOpen, setIsProductsOpen] = useState(isProductsSectionActive);
  const [isInventoryOpen, setIsInventoryOpen] = useState(
    isInventorySectionActive,
  );
  const [isShippingOpen, setIsShippingOpen] = useState(isShippingSectionActive);
  const [isUsersOpen, setIsUsersOpen] = useState(isUsersSectionActive);

  useEffect(() => {
    if (isCollapsed) {
      setIsProductsOpen(false);
      setIsInventoryOpen(false);
      setIsShippingOpen(false);
      setIsUsersOpen(false);
      return;
    }

    if (isProductsSectionActive) setIsProductsOpen(true);
    if (isInventorySectionActive) setIsInventoryOpen(true);
    if (isShippingSectionActive) setIsShippingOpen(true);
    if (isUsersSectionActive) setIsUsersOpen(true);
  }, [
    isCollapsed,
    isProductsSectionActive,
    isInventorySectionActive,
    isShippingSectionActive,
    isUsersSectionActive,
  ]);

  const renderMenuItem = (item: SidebarItem) => {
    const Icon = item.icon;
    const isActive = item.exact
      ? location.pathname === item.href
      : location.pathname === item.href ||
        location.pathname.startsWith(item.href + "/");

    const menuItem = (
      <Link
        to={item.href}
        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
          isActive
            ? "bg-blue-500 text-white"
            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        }`}
      >
        <Icon className="w-6 h-6 shrink-0" />
        {!isCollapsed && <span>{item.name}</span>}
      </Link>
    );

    if (item.permission) {
      return (
        <Can
          key={item.name}
          module={item.permission.module}
          action={item.permission.action}
        >
          {menuItem}
        </Can>
      );
    }

    return <div key={item.name}>{menuItem}</div>;
  };

  const renderChildItem = (item: SidebarItem) => {
    // Logic mới sử dụng thuộc tính exact thay cho hardcode
    const isActive = item.exact
      ? location.pathname === item.href
      : location.pathname === item.href ||
        location.pathname.startsWith(item.href + "/");

    const child = (
      <Link
        to={item.href}
        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
          isActive
            ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
            : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
        }`}
      >
        <item.icon className="h-4 w-4 shrink-0" />
        <span>{item.name}</span>
      </Link>
    );

    if (item.permission) {
      return (
        <Can
          key={item.name}
          module={item.permission.module}
          action={item.permission.action}
        >
          {child}
        </Can>
      );
    }

    return <div key={item.name}>{child}</div>;
  };

  const renderGroup = ({
    title,
    href,
    icon: Icon,
    isActive,
    isOpen,
    setIsOpen,
    children,
  }: {
    title: string;
    href: string;
    icon: LucideIcon;
    isActive: boolean;
    isOpen: boolean;
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    children: SidebarItem[];
  }) => {
    return (
      <div className="rounded-xl">
        <div className="flex items-center gap-2">
          <Link
            to={href}
            onClick={() => !isCollapsed && setIsOpen(true)}
            className={`flex min-w-0 flex-1 items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              isActive
                ? "bg-blue-500 text-white"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <Icon className="w-6 h-6 shrink-0" />
            {!isCollapsed && <span>{title}</span>}
          </Link>

          {!isCollapsed && (
            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              className={`rounded-lg p-2 transition-colors ${
                isActive
                  ? "text-white hover:bg-blue-600"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
              aria-label={`Toggle ${title.toLowerCase()} menu`}
            >
              {isOpen ? (
                <ChevronDown className="w-5 h-5" />
              ) : (
                <ChevronRight className="w-5 h-5" />
              )}
            </button>
          )}
        </div>

        {!isCollapsed && isOpen && (
          <div className="mt-2 ml-3 space-y-1 border-l border-gray-200 pl-3 dark:border-gray-700">
            {children.map(renderChildItem)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`${
        isCollapsed ? "w-20" : "w-64"
      } bg-white dark:bg-gray-800 shadow-md flex flex-col transition-all duration-300 ease-in-out`}
    >
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
        {!isCollapsed && (
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            My admin
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

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <div className="space-y-2">
          <Link
            to="/admin/dashboard"
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              location.pathname === "/admin/dashboard"
                ? "bg-blue-500 text-white"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <LayoutDashboard className="w-6 h-6 shrink-0" />
            {!isCollapsed && <span>Dashboard</span>}
          </Link>

          {renderGroup({
            title: "Products",
            href: "/admin/products",
            icon: ShoppingBag,
            isActive: isProductsSectionActive,
            isOpen: isProductsOpen,
            setIsOpen: setIsProductsOpen,
            children: productChildren,
          })}

          {renderGroup({
            title: "Inventory",
            href: "/admin/inventory",
            icon: Package2,
            isActive: isInventorySectionActive,
            isOpen: isInventoryOpen,
            setIsOpen: setIsInventoryOpen,
            children: inventoryChildren,
          })}

          {renderGroup({
            title: "Shipping",
            href: "/admin/shipping",
            icon: Truck,
            isActive: isShippingSectionActive,
            isOpen: isShippingOpen,
            setIsOpen: setIsShippingOpen,
            children: shippingChildren,
          })}

          <Can module="user" action="view">
            {renderGroup({
              title: "Users",
              href: "/admin/users/hub",
              icon: Users,
              isActive: isUsersSectionActive,
              isOpen: isUsersOpen,
              setIsOpen: setIsUsersOpen,
              children: userChildren,
            })}
          </Can>
        </div>

        <div className="space-y-2">
          {sidebarItems.slice(1).map(renderMenuItem)}
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;
