export type AuditLogRecord = {
  id: number;
  actorUserId?: number | null;
  actorRoleId?: number | null;
  branchId?: number | null;
  action: string;
  moduleName: string;
  entityType?: string | null;
  entityId?: number | null;
  requestId?: string | null;
  httpMethod?: string | null;
  routePath?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  oldValuesJson?: Record<string, any> | null;
  newValuesJson?: Record<string, any> | null;
  metaJson?: Record<string, any> | null;
  createdAt?: Date;
};

export type AuditLogListItem = AuditLogRecord & {
  actorName?: string | null;
  actorEmail?: string | null;
  actorAvatar?: string | null;
  roleTitle?: string | null;
  roleCode?: string | null;
  branchName?: string | null;
  branchCode?: string | null;
};

export type CreateAuditLogInput = {
  actorUserId?: number | null;
  actorRoleId?: number | null;
  branchId?: number | null;
  action: string;
  moduleName: string;
  entityType?: string | null;
  entityId?: number | null;
  requestId?: string | null;
  httpMethod?: string | null;
  routePath?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  oldValuesJson?: Record<string, any> | null;
  newValuesJson?: Record<string, any> | null;
  metaJson?: Record<string, any> | null;
};

export type AuditLogListFilter = {
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

export type AuditLogListResult = {
  rows: AuditLogListItem[];
  count: number;
  page: number;
  limit: number;
};
