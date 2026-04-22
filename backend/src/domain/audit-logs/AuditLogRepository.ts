import type { Transaction } from "sequelize";
import type {
  AuditLogListFilter,
  AuditLogListResult,
  AuditLogRecord,
  CreateAuditLogInput,
} from "./types";

export interface AuditLogRepository {
  create(
    input: CreateAuditLogInput,
    transaction?: Transaction,
  ): Promise<AuditLogRecord>;

  list(filter: AuditLogListFilter): Promise<AuditLogListResult>;
}
