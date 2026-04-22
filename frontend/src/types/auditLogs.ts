export interface AuditLogActorSummary {
  id: number;
  email?: string | null;
  fullName?: string | null;
}

export interface AuditLogBranchSummary {
  id: number;
  name?: string | null;
  code?: string | null;
}

export interface AuditLogItem {
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
  createdAt: string;
  actor?: AuditLogActorSummary | null;
  branch?: AuditLogBranchSummary | null;
}

export interface AuditLogsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListAuditLogsParams {
  page?: number;
  limit?: number;
  moduleName?: string;
  action?: string;
  actorUserId?: number | null;
  branchId?: number | null;
  entityType?: string;
  entityId?: number | null;
  from?: string;
  to?: string;
  q?: string;
}

export interface ListAuditLogsResponse {
  items: AuditLogItem[];
  pagination: AuditLogsPagination;
}
