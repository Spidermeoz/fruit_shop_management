// src/domain/roles/RoleRepository.ts
import { Role } from "./Role";
import type {
  Permissions,
  RoleListFilter,
  RoleScope,
  AssignableRoleFilter,
} from "./types";

export type CreateRoleInput = {
  code: string;
  scope: RoleScope;
  level: number;
  isAssignable?: boolean;
  isProtected?: boolean;
  title: string;
  description?: string | null;
  permissions?: Permissions | null;
};

export type UpdateRolePatch = Partial<CreateRoleInput>;

export type RolePermissionMatrixItem = {
  id: number;
  code: string;
  scope: RoleScope;
  level: number;
  isAssignable: boolean;
  isProtected: boolean;
  title: string;
  permissions: Permissions;
};

export interface RoleRepository {
  list(filter: RoleListFilter): Promise<{ rows: Role[]; count: number }>;

  findById(id: number, includeDeleted?: boolean): Promise<Role | null>;

  findByCode(code: string, includeDeleted?: boolean): Promise<Role | null>;

  listAssignable(filter: AssignableRoleFilter): Promise<Role[]>;

  create(input: CreateRoleInput): Promise<Role>;

  update(id: number, patch: UpdateRolePatch): Promise<Role>;

  softDelete(id: number): Promise<{ id: number; title: string }>;

  listForPermissions(): Promise<RolePermissionMatrixItem[]>;

  updatePermissions(
    roles: Array<{ id: number; permissions: Permissions }>,
  ): Promise<void>;
}
