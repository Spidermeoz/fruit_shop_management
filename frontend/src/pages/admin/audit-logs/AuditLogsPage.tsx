import React, { useEffect, useMemo, useState } from "react";
import { RefreshCcw, Search } from "lucide-react";
import { auditLogsApi } from "../../../services/api/auditLogsApi";
import type {
  AuditLogItem,
  ListAuditLogsResponse,
} from "../../../types/auditLogs";
import { useAdminToast } from "../../../context/AdminToastContext";
import Card from "../../../components/admin/layouts/Card";

const defaultResponse: ListAuditLogsResponse = {
  items: [],
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  },
};

const formatJsonPreview = (value: Record<string, any> | null | undefined) => {
  if (!value || typeof value !== "object") return "—";
  const entries = Object.entries(value).slice(0, 3);
  if (!entries.length) return "—";
  return entries.map(([key, val]) => `${key}: ${String(val)}`).join(" • ");
};

const AuditLogsPage: React.FC = () => {
  const { showErrorToast } = useAdminToast();

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<ListAuditLogsResponse>(defaultResponse);
  const [search, setSearch] = useState("");
  const [moduleName, setModuleName] = useState("");
  const [action, setAction] = useState("");

  const params = useMemo(
    () => ({
      page,
      limit: 20,
      q: search,
      moduleName,
      action,
    }),
    [page, search, moduleName, action],
  );

  const loadAuditLogs = async (opts?: { silent?: boolean }) => {
    const silent = Boolean(opts?.silent);
    if (silent) setRefreshing(true);
    else setLoading(true);

    try {
      const nextData = await auditLogsApi.list(params);
      setData(nextData);
    } catch (err: any) {
      showErrorToast(
        err?.message || "Không tải được audit logs.",
        "Tải audit logs thất bại",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadAuditLogs();
  }, [params]);

  const rows = data.items;
  const pagination = data.pagination;

  return (
    <div className="w-full pb-10 space-y-6">
      {/* Tầng A: Header / Command Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Audit Logs
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-2xl">
            Theo dõi lịch sử thao tác của admin/staff theo module, action và
            thời gian.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => void loadAuditLogs({ silent: true })}
            className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            title="Làm mới dữ liệu"
          >
            <RefreshCcw
              className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Tầng B: Filters */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col gap-4">
        <div className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-3">
          <Search className="h-5 w-5 text-blue-600" /> Bộ lọc hiển thị
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
                placeholder="request id, entity type, route path..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Module
            </label>
            <input
              value={moduleName}
              onChange={(e) => {
                setPage(1);
                setModuleName(e.target.value);
              }}
              placeholder="order, user, promotion..."
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Action
            </label>
            <input
              value={action}
              onChange={(e) => {
                setPage(1);
                setAction(e.target.value);
              }}
              placeholder="create, update, delete..."
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
        </div>
      </div>

      {/* Main Table Area */}
      <Card className="!p-0 overflow-hidden border border-gray-200 dark:border-gray-700 shadow-none">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Danh sách Audit Logs
          </h2>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Tổng <strong>{pagination.total}</strong> bản ghi
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                  Thời gian
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                  Module / Action
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                  Actor
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                  Entity
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                  Diff preview
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                Array.from({ length: 8 }).map((_, index) => (
                  <tr key={index}>
                    <td className="px-5 py-4" colSpan={5}>
                      <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                    </td>
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Search className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
                      <span className="font-medium">
                        Chưa có audit log phù hợp với bộ lọc hiện tại.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((item: AuditLogItem) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                  >
                    <td className="px-5 py-4 text-sm font-medium text-gray-600 dark:text-gray-300 align-top">
                      {new Date(item.createdAt).toLocaleString("vi-VN")}
                    </td>
                    <td className="px-5 py-4 align-top">
                      <div className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 border border-blue-200 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        {item.moduleName}
                      </div>
                      <div className="mt-1.5 text-sm font-bold text-gray-900 dark:text-white">
                        {item.action}
                      </div>
                      {item.httpMethod || item.routePath ? (
                        <div className="mt-1 text-xs text-gray-500 font-mono dark:text-gray-400">
                          {[item.httpMethod, item.routePath]
                            .filter(Boolean)
                            .join(" • ")}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-200 align-top">
                      <div className="font-semibold">
                        {item.actor?.fullName || item.actor?.email || "System"}
                      </div>
                      {item.branch?.name && (
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {item.branch.name}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-200 align-top">
                      <div className="font-semibold">
                        {item.entityType || "—"}
                      </div>
                      <div className="mt-1 text-xs text-gray-500 font-mono dark:text-gray-400">
                        {item.entityId != null
                          ? `#${item.entityId}`
                          : "Không có entity id"}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300 align-top">
                      <div className="font-mono text-xs">
                        {formatJsonPreview(
                          item.newValuesJson || item.oldValuesJson,
                        )}
                      </div>
                      {item.requestId && (
                        <div className="mt-1.5 text-[11px] text-gray-400 dark:text-gray-500 font-mono">
                          req: {item.requestId}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-3 text-sm font-medium text-gray-500 dark:text-gray-400 mt-4 px-2">
        <div>
          Trang {pagination.page} / {pagination.totalPages}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page <= 1 || loading}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 disabled:opacity-50 hover:bg-gray-50 transition dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            Trước
          </button>
          <button
            type="button"
            onClick={() => setPage((prev) => prev + 1)}
            disabled={page >= pagination.totalPages || loading}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 disabled:opacity-50 hover:bg-gray-50 transition dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            Sau
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditLogsPage;
