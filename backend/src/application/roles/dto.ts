// src/application/roles/dto.ts
import type { Role } from "../../domain/roles/Role";

export type RoleDTO = {
  id: number;
  title: string;
  description: string | null;
  permissions: Record<string, string[]> | null; // { [module]: string[] }
  deleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

// Domain → DTO (camelCase để controller dễ map ra snake_case nếu cần)
export const toRoleDTO = (role: Role): RoleDTO => ({
  id: role.props.id!,
  title: role.props.title,
  description: role.props.description ?? null,
  permissions: role.props.permissions ?? null,
  deleted: !!role.props.deleted,
  deletedAt: role.props.deletedAt ?? null,
  createdAt: role.props.createdAt!,
  updatedAt: role.props.updatedAt!,
});
