// src/domain/roles/RoleRepository.ts
import { Role } from "./Role";
import type { Permissions, RoleListFilter } from "./types";

export type CreateRoleInput = {
  title: string;
  description?: string | null;
  permissions?: Permissions | null;
};

export type UpdateRolePatch = Partial<CreateRoleInput>;

export interface RoleRepository {
  list(filter: RoleListFilter): Promise<{ rows: Role[]; count: number }>;

  findById(id: number, includeDeleted?: boolean): Promise<Role | null>;

  create(input: CreateRoleInput): Promise<Role>;

  update(id: number, patch: UpdateRolePatch): Promise<Role>;

  softDelete(id: number): Promise<{ id: number; title: string }>;

  // Dùng cho màn "Phân quyền" (GET /permissions)
  listForPermissions(): Promise<Array<{ id: number; title: string; permissions: Permissions }>>;

  // Dùng cho PATCH /permissions
  updatePermissions(
    roles: Array<{ id: number; permissions: Permissions }>
  ): Promise<void>;
}
