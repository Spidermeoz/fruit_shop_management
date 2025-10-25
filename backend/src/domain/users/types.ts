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

export type ListUsersFilter = {
  q?: string;
  status?: UserStatus | string;
  includeDeleted?: boolean; // default: false
  sort?: UserSort;
  limit?: number;           // repository có thể nhận limit/offset
  offset?: number;
};
