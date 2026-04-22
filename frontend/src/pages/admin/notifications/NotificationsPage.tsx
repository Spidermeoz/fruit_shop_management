import React, { useMemo, useState } from "react";
import {
  Bell,
  CheckCheck,
  Layers,
  List,
  RefreshCcw,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import NotificationList from "../../../components/admin/notifications/NotificationList";
import { useNotifications } from "../../../hooks/useNotifications";
import type {
  NotificationCategory,
  NotificationItem,
  NotificationSeverity,
} from "../../../types/notifications";

const severityOptions: Array<{
  label: string;
  value: NotificationSeverity | "all";
}> = [
  { label: "Tất cả mức độ", value: "all" },
  { label: "Critical", value: "critical" },
  { label: "Warning", value: "warning" },
  { label: "Info", value: "info" },
];

const categoryOptions: Array<{
  label: string;
  value: NotificationCategory | "all";
}> = [
  { label: "Tất cả nhóm", value: "all" },
  { label: "Đơn hàng", value: "orders" },
  { label: "Tồn kho", value: "inventory" },
  { label: "Review", value: "reviews" },
  { label: "Chi nhánh", value: "branches" },
  { label: "Giao hàng", value: "shipping" },
  { label: "Khuyến mãi", value: "promotions" },
  { label: "User", value: "users" },
  { label: "Nội dung", value: "content" },
  { label: "Hệ thống", value: "system" },
];

const readStateOptions = [
  { label: "Tất cả", value: "all" as const },
  { label: "Chưa đọc", value: "unread" as const },
  { label: "Đã đọc", value: "read" as const },
];

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState<NotificationSeverity | "all">("all");
  const [category, setCategory] = useState<NotificationCategory | "all">("all");
  const [readState, setReadState] = useState<"all" | "read" | "unread">("all");

  const params = useMemo(
    () => ({
      page,
      limit: 12,
      q: search,
      severity,
      category,
      readState,
    }),
    [page, search, severity, category, readState],
  );

  const {
    items,
    pagination,
    unreadCount,
    isLoading,
    isRefreshing,
    isMutating,
    fetchNotifications,
    markRead,
    markAllRead,
  } = useNotifications({
    params,
    autoFetch: true,
    pollIntervalMs: 15000,
  });

  const handleItemClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      await markRead(item.id).catch(() => undefined);
    }

    if (item.targetUrl) {
      navigate(item.targetUrl);
    }
  };

  const disablePrev = page <= 1 || isLoading;
  const disableNext = page >= pagination.totalPages || isLoading;

  return (
    <div className="w-full pb-10 space-y-6">
      {/* Tầng A: Header / Command Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Notification Center
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-2xl">
            Theo dõi đơn hàng mới, review mới và cảnh báo tồn kho trong một nơi
            tập trung.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-2 hidden md:inline-block">
            {isRefreshing ? "Đang đồng bộ..." : "Auto-poll 15s"}
          </span>
          <button
            type="button"
            onClick={() => void fetchNotifications()}
            className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            title="Làm mới dữ liệu"
          >
            <RefreshCcw
              className={`w-5 h-5 ${isRefreshing ? "animate-spin text-blue-600" : ""}`}
            />
          </button>
          <button
            type="button"
            onClick={() => void markAllRead()}
            disabled={isMutating || unreadCount <= 0}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition shadow-sm ml-auto md:ml-0 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <CheckCheck className="w-4 h-4" />
            Đánh dấu đọc hết
          </button>
        </div>
      </div>

      {/* Tầng B: KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col justify-center cursor-default hover:border-blue-400 hover:shadow-sm transition-all">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 truncate">
              Tổng bản ghi
            </span>
          </div>
          <div className="text-xl font-black text-gray-900 dark:text-white">
            {pagination.total}
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col justify-center cursor-default hover:border-blue-400 hover:shadow-sm transition-all">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-4 h-4 text-amber-500" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 truncate">
              Chưa đọc
            </span>
          </div>
          <div
            className={`text-xl font-black ${unreadCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-gray-900 dark:text-white"}`}
          >
            {unreadCount}
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col justify-center cursor-default hover:border-blue-400 hover:shadow-sm transition-all">
          <div className="flex items-center gap-2 mb-2">
            <List className="w-4 h-4 text-green-600" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 truncate">
              Trang hiện tại
            </span>
          </div>
          <div className="text-xl font-black text-gray-900 dark:text-white">
            {pagination.page}{" "}
            <span className="text-sm font-medium text-gray-500">
              / {pagination.totalPages}
            </span>
          </div>
        </div>
      </div>

      {/* Tầng C: Filters */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col gap-4">
        <div className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-3">
          <Search className="h-5 w-5 text-blue-600" /> Bộ lọc hiển thị
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Tìm kiếm
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
                placeholder="Tiêu đề, nội dung..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Mức độ
            </label>
            <select
              value={severity}
              onChange={(e) => {
                setPage(1);
                setSeverity(e.target.value as NotificationSeverity | "all");
              }}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            >
              {severityOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Nhóm
            </label>
            <select
              value={category}
              onChange={(e) => {
                setPage(1);
                setCategory(e.target.value as NotificationCategory | "all");
              }}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            >
              {categoryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Trạng thái đọc
            </label>
            <select
              value={readState}
              onChange={(e) => {
                setPage(1);
                setReadState(e.target.value as "all" | "read" | "unread");
              }}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            >
              {readStateOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main List Component */}
      <div className="min-h-[400px]">
        <NotificationList
          items={items}
          loading={isLoading}
          onItemClick={(item) => void handleItemClick(item)}
          onMarkRead={(item) => void markRead(item.id)}
        />
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 text-sm font-medium text-gray-500 dark:text-gray-400 mt-4 px-2">
          <div>
            Trang {pagination.page} / {pagination.totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={disablePrev}
              onClick={() => setPage((page) => Math.max(1, page - 1))}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 disabled:opacity-50 hover:bg-gray-50 transition dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              Trước
            </button>
            <button
              type="button"
              disabled={disableNext}
              onClick={() =>
                setPage((page) => Math.min(pagination.totalPages, page + 1))
              }
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 disabled:opacity-50 hover:bg-gray-50 transition dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
