// src/domain/roles/types.ts

export type Permissions = Record<string, string[]>;

export type RoleScope = "system" | "branch" | "client";

export type RoleListFilter = {
  includeDeleted?: boolean;
  q?: string;
  scope?: RoleScope;
  assignableOnly?: boolean;
};

export type AssignableRoleFilter = {
  actorRoleCode?: string | null;
  actorLevel?: number | null;
  actorIsSuperAdmin?: boolean;
};
