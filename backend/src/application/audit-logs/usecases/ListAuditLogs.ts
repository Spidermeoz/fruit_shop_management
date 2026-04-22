import type { AuditLogRepository } from "../../../domain/audit-logs/AuditLogRepository";
import type { AuditLogListResult } from "../../../domain/audit-logs/types";

type Input = {
  page?: number;
  limit?: number;
  actorUserId?: number | null;
  actorRoleId?: number | null;
  branchId?: number | null;
  moduleName?: string | null;
  action?: string | null;
  requestId?: string | null;
  q?: string;
  dateFrom?: string | null;
  dateTo?: string | null;
};

const normalizePositiveInt = (value: unknown, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
};

const normalizeOptionalId = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;

  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
};

export class ListAuditLogs {
  constructor(private readonly auditLogRepo: AuditLogRepository) {}

  async execute(input: Input): Promise<AuditLogListResult> {
    return this.auditLogRepo.list({
      page: normalizePositiveInt(input?.page, 1),
      limit: Math.min(100, normalizePositiveInt(input?.limit, 20)),
      actorUserId: normalizeOptionalId(input?.actorUserId),
      actorRoleId: normalizeOptionalId(input?.actorRoleId),
      branchId: normalizeOptionalId(input?.branchId),
      moduleName: String(input?.moduleName ?? "").trim() || null,
      action: String(input?.action ?? "").trim() || null,
      requestId: String(input?.requestId ?? "").trim() || null,
      q: String(input?.q ?? "").trim(),
      dateFrom: input?.dateFrom ?? null,
      dateTo: input?.dateTo ?? null,
    });
  }
}
