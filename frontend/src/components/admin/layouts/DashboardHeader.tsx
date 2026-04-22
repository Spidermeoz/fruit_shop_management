import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { Moon, Sun, Bell, LogOut, ChevronDown, GitBranch } from "lucide-react";
import { useTheme } from "../../../context/ThemeContext";
import { useAuth } from "../../../context/AuthContextAdmin";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

type HeaderNotificationItem = {
  id: number;
  title: string;
  message: string;
  targetUrl?: string | null;
  isRead?: boolean;
  severity?: string | null;
  createdAt?: string | null;
};

const formatNotificationTime = (value?: string | null) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("vi-VN");
};

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
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<HeaderNotificationItem[]>(
    [],
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const { showErrorToast, showSuccessToast } = useAdminToast();

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }

      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(e.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/admin/auth/login", { replace: true });
  };

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await http<any>(
        "GET",
        "/api/v1/admin/notifications/unread-count",
      );
      setUnreadCount(Number(res?.data?.unread ?? 0));
    } catch {
      // ignore silent unread-count failures in header
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoadingNotifications(true);
      const res = await http<any>("GET", "/api/v1/admin/notifications?limit=8");
      setNotifications(Array.isArray(res?.data) ? res.data : []);
    } catch (err: any) {
      showErrorToast(
        err?.message || "Không thể tải notifications",
        "Notifications",
      );
    } finally {
      setLoadingNotifications(false);
    }
  }, [showErrorToast]);

  useEffect(() => {
    void fetchUnreadCount();

    const timer = window.setInterval(() => {
      void fetchUnreadCount();
    }, 15000);

    return () => window.clearInterval(timer);
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (!notificationsOpen) return;
    void fetchNotifications();
  }, [fetchNotifications, notificationsOpen]);

  const handleMarkAllNotificationsRead = async () => {
    const unreadIds = notifications
      .filter((item) => !item.isRead)
      .map((item) => Number(item.id))
      .filter((value) => Number.isFinite(value) && value > 0);

    if (!unreadIds.length) return;

    try {
      setMarkingAllRead(true);
      await http<any>("PATCH", "/api/v1/admin/notifications/read-all", {
        notificationIds: unreadIds,
      });
      setNotifications((prev) =>
        prev.map((item) => ({ ...item, isRead: true })),
      );
      setUnreadCount(0);
      showSuccessToast({
        title: "Notifications",
        message: "Đã đánh dấu toàn bộ thông báo là đã đọc.",
      });
    } catch (err: any) {
      showErrorToast(
        err?.message || "Không thể cập nhật notifications",
        "Notifications",
      );
    } finally {
      setMarkingAllRead(false);
    }
  };

  const handleOpenNotificationItem = async (item: HeaderNotificationItem) => {
    try {
      if (!item.isRead) {
        await http<any>("PATCH", `/api/v1/admin/notifications/${item.id}/read`);
        setNotifications((prev) =>
          prev.map((current) =>
            current.id === item.id ? { ...current, isRead: true } : current,
          ),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch {
      // ignore mark-read error here to keep navigation smooth
    }

    setNotificationsOpen(false);
    navigate(item.targetUrl || "/admin/notifications");
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

          <div className="relative" ref={notificationsRef}>
            <button
              type="button"
              onClick={() => setNotificationsOpen((prev) => !prev)}
              className="relative rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              {unreadCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 min-w-[18px] rounded-full bg-red-500 px-1.5 py-0.5 text-center text-[10px] font-bold leading-none text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              ) : null}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-[360px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800 z-20">
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-700">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      Notifications
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {unreadCount} chưa đọc
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleMarkAllNotificationsRead()}
                    disabled={markingAllRead || unreadCount <= 0}
                    className="text-xs font-medium text-blue-600 transition hover:text-blue-700 disabled:cursor-not-allowed disabled:text-gray-400 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {markingAllRead ? "Đang xử lý..." : "Đánh dấu đã đọc"}
                  </button>
                </div>

                <div className="max-h-[420px] overflow-y-auto">
                  {loadingNotifications ? (
                    <div className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">
                      Đang tải notifications...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">
                      Hiện chưa có thông báo nào.
                    </div>
                  ) : (
                    notifications.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => void handleOpenNotificationItem(item)}
                        className={`block w-full border-b border-gray-100 px-4 py-3 text-left transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/60 ${
                          item.isRead
                            ? "bg-transparent"
                            : "bg-blue-50/70 dark:bg-blue-900/10"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-1 text-sm font-semibold text-gray-900 dark:text-white">
                              {item.title}
                            </p>
                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500 dark:text-gray-400">
                              {item.message}
                            </p>
                            <p className="mt-2 text-[11px] text-gray-400 dark:text-gray-500">
                              {formatNotificationTime(item.createdAt)}
                            </p>
                          </div>

                          {!item.isRead ? (
                            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500" />
                          ) : null}
                        </div>
                      </button>
                    ))
                  )}
                </div>

                <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-700">
                  <Link
                    to="/admin/notifications"
                    className="text-sm font-medium text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    onClick={() => setNotificationsOpen(false)}
                  >
                    Xem tất cả notifications
                  </Link>
                </div>
              </div>
            )}
          </div>

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
