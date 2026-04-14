// src/application/roles/dto.ts
import type { Role } from "../../domain/roles/Role";

export type RoleDTO = {
  id: number;
  code: string;
  scope: "system" | "branch" | "client";
  level: number;
  isAssignable: boolean;
  isProtected: boolean;

  title: string;
  description: string | null;
  permissions: Record<string, string[]> | null;

  deleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export const toRoleDTO = (role: Role): RoleDTO => ({
  id: role.props.id!,
  code: role.props.code,
  scope: role.props.scope,
  level: role.props.level,
  isAssignable: role.props.isAssignable,
  isProtected: role.props.isProtected,

  title: role.props.title,
  description: role.props.description ?? null,
  permissions: role.props.permissions ?? null,

  deleted: !!role.props.deleted,
  deletedAt: role.props.deletedAt ?? null,
  createdAt: role.props.createdAt!,
  updatedAt: role.props.updatedAt!,
});
