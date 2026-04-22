import { http } from "../http";
import type {
  AuditLogItem,
  ListAuditLogsParams,
  ListAuditLogsResponse,
} from "../../types/auditLogs";

const AUDIT_LOGS_BASE = "/api/v1/admin/audit-logs";

const appendParam = (
  searchParams: URLSearchParams,
  key: string,
  value: string | number | null | undefined,
) => {
  if (value === undefined || value === null || value === "") return;
  searchParams.set(key, String(value));
};

const buildQueryString = (params: ListAuditLogsParams = {}) => {
  const searchParams = new URLSearchParams();

  appendParam(searchParams, "page", params.page);
  appendParam(searchParams, "limit", params.limit);
  appendParam(searchParams, "moduleName", params.moduleName?.trim());
  appendParam(searchParams, "action", params.action?.trim());
  appendParam(searchParams, "actorUserId", params.actorUserId);
  appendParam(searchParams, "branchId", params.branchId);
  appendParam(searchParams, "requestId", params.q?.trim());
  appendParam(searchParams, "dateFrom", params.from?.trim());
  appendParam(searchParams, "dateTo", params.to?.trim());
  appendParam(searchParams, "q", params.q?.trim());

  const raw = searchParams.toString();
  return raw ? `?${raw}` : "";
};

const normalizeAuditLogItem = (item: any): AuditLogItem => ({
  id: Number(item?.id ?? 0),
  actorUserId:
    item?.actorUserId !== null && item?.actorUserId !== undefined
      ? Number(item.actorUserId)
      : null,
  actorRoleId:
    item?.actorRoleId !== null && item?.actorRoleId !== undefined
      ? Number(item.actorRoleId)
      : null,
  branchId:
    item?.branchId !== null && item?.branchId !== undefined
      ? Number(item.branchId)
      : null,
  action: String(item?.action ?? ""),
  moduleName: String(item?.moduleName ?? ""),
  entityType: item?.entityType ?? null,
  entityId:
    item?.entityId !== null && item?.entityId !== undefined
      ? Number(item.entityId)
      : null,
  requestId: item?.requestId ?? null,
  httpMethod: item?.httpMethod ?? null,
  routePath: item?.routePath ?? null,
  ipAddress: item?.ipAddress ?? null,
  userAgent: item?.userAgent ?? null,
  oldValuesJson: item?.oldValuesJson ?? null,
  newValuesJson: item?.newValuesJson ?? null,
  metaJson: item?.metaJson ?? null,
  createdAt: item?.createdAt ?? new Date().toISOString(),
  actor:
    item?.actorUserId || item?.actorName || item?.actorEmail
      ? {
          id: Number(item?.actorUserId ?? 0),
          fullName: item?.actorName ?? null,
          email: item?.actorEmail ?? null,
        }
      : null,
  branch:
    item?.branchId || item?.branchName || item?.branchCode
      ? {
          id: Number(item?.branchId ?? 0),
          name: item?.branchName ?? null,
          code: item?.branchCode ?? null,
        }
      : null,
});

export const auditLogsApi = {
  async list(params: ListAuditLogsParams = {}): Promise<ListAuditLogsResponse> {
    const res = await http<any>(
      "GET",
      `${AUDIT_LOGS_BASE}${buildQueryString(params)}`,
    );

    const items = Array.isArray(res?.data)
      ? res.data.map(normalizeAuditLogItem)
      : [];

    const page = Number(res?.meta?.page ?? 1);
    const limit = Number(res?.meta?.limit ?? 20);
    const total = Number(res?.meta?.total ?? items.length);
    const totalPages = Math.max(1, Math.ceil(total / Math.max(1, limit)));

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  },
};
