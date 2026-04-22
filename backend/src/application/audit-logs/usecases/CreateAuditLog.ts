import type { AuditLogRepository } from "../../../domain/audit-logs/AuditLogRepository";
import type {
  AuditLogRecord,
  CreateAuditLogInput,
} from "../../../domain/audit-logs/types";

const normalizeText = (value?: string | null): string | null => {
  const normalized = String(value ?? "").trim();
  return normalized ? normalized : null;
};

const normalizeId = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;

  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
};

export class CreateAuditLog {
  constructor(private readonly auditLogRepo: AuditLogRepository) {}

  async execute(input: CreateAuditLogInput): Promise<AuditLogRecord> {
    const action = String(input?.action ?? "")
      .trim()
      .toLowerCase();
    const moduleName = String(input?.moduleName ?? "")
      .trim()
      .toLowerCase();

    if (!action) {
      throw new Error("Audit action is required");
    }

    if (!moduleName) {
      throw new Error("Audit moduleName is required");
    }

    return this.auditLogRepo.create({
      actorUserId: normalizeId(input?.actorUserId),
      actorRoleId: normalizeId(input?.actorRoleId),
      branchId: normalizeId(input?.branchId),
      action,
      moduleName,
      entityType: normalizeText(input?.entityType),
      entityId: normalizeId(input?.entityId),
      requestId: normalizeText(input?.requestId),
      httpMethod: normalizeText(input?.httpMethod)?.toUpperCase() ?? null,
      routePath: normalizeText(input?.routePath),
      ipAddress: normalizeText(input?.ipAddress),
      userAgent: normalizeText(input?.userAgent),
      oldValuesJson:
        input?.oldValuesJson && typeof input.oldValuesJson === "object"
          ? input.oldValuesJson
          : null,
      newValuesJson:
        input?.newValuesJson && typeof input.newValuesJson === "object"
          ? input.newValuesJson
          : null,
      metaJson:
        input?.metaJson && typeof input.metaJson === "object"
          ? input.metaJson
          : null,
    });
  }
}
