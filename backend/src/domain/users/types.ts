// src/domain/users/types.ts

export type UserStatus = "active" | "inactive" | "banned";

export type UserSortColumn =
  | "id"
  | "full_name"
  | "email"
  | "phone"
  | "status"
  | "created_at"
  | "updated_at";

export type UserSort = { column: UserSortColumn; dir: "ASC" | "DESC" };

export type UserTypeFilter = "internal" | "customer" | "all";

export type ListUsersFilter = {
  q?: string;
  status?: UserStatus | string;
  includeDeleted?: boolean;
  sort?: UserSort;
  limit?: number;
  offset?: number;

  // scope/filter mới
  userType?: UserTypeFilter;
  branchId?: number | null;

  // actor scope
  viewerRoleId?: number | null;
  allowedBranchIds?: number[];

  // quyền toàn hệ thống hay không
  canViewAllInternalUsers?: boolean;
};