// src/domain/roles/Role.ts
import type { Permissions, RoleScope } from "./types";

export interface RoleProps {
  id?: number;

  code: string;
  scope: RoleScope;
  level: number;
  isAssignable: boolean;
  isProtected: boolean;

  title: string;
  description?: string | null;
  permissions?: Permissions | null;

  deleted?: boolean;
  deletedAt?: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export class Role {
  private _props: RoleProps;

  private constructor(props: RoleProps) {
    this._props = Role.validate(props);
  }

  static create(props: RoleProps) {
    return new Role(props);
  }

  get props(): Readonly<RoleProps> {
    return this._props;
  }

  static validate(p: RoleProps): RoleProps {
    const title = p.title?.toString().trim();
    if (!title) {
      throw new Error("Role.title is required");
    }

    const code = p.code?.toString().trim().toLowerCase();
    if (!code) {
      throw new Error("Role.code is required");
    }

    const scope: RoleScope =
      p.scope === "system" || p.scope === "branch" || p.scope === "client"
        ? p.scope
        : "branch";

    const level = Number(p.level);
    if (!Number.isFinite(level) || level < 0) {
      throw new Error("Role.level must be a non-negative number");
    }

    return {
      id: p.id,
      code,
      scope,
      level,
      isAssignable: !!p.isAssignable,
      isProtected: !!p.isProtected,
      title,
      description: p.description ?? null,
      permissions: p.permissions ?? null,
      deleted: p.deleted ?? false,
      deletedAt: p.deletedAt ?? null,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }

  rename(nextTitle: string) {
    this._props = Role.validate({ ...this._props, title: nextTitle });
  }

  setPermissions(perms: Permissions | null) {
    this._props = Role.validate({ ...this._props, permissions: perms });
  }

  updateMetadata(
    input: Partial<{
      code: string;
      scope: RoleScope;
      level: number;
      isAssignable: boolean;
      isProtected: boolean;
      description: string | null;
    }>,
  ) {
    this._props = Role.validate({
      ...this._props,
      code: input.code ?? this._props.code,
      scope: input.scope ?? this._props.scope,
      level: input.level ?? this._props.level,
      isAssignable: input.isAssignable ?? this._props.isAssignable,
      isProtected: input.isProtected ?? this._props.isProtected,
      description:
        input.description !== undefined
          ? input.description
          : this._props.description,
    });
  }

  softDelete() {
    this._props = Role.validate({
      ...this._props,
      deleted: true,
      deletedAt: new Date(),
    });
  }
}
