// src/domain/roles/Role.ts
import type { Permissions } from "./types";

export interface RoleProps {
  id?: number;
  title: string;
  description?: string | null;
  permissions?: Permissions | null;

  // Soft-delete
  deleted?: boolean;          // domain dùng boolean
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
    if (!p.title || !p.title.toString().trim()) {
      throw new Error("Role.title is required");
    }
    return {
      title: p.title.toString().trim(),
      description: p.description ?? null,
      permissions: p.permissions ?? null,
      deleted: p.deleted ?? false,
      deletedAt: p.deletedAt ?? null,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      id: p.id,
    };
  }

  rename(nextTitle: string) {
    this._props = Role.validate({ ...this._props, title: nextTitle });
  }

  setPermissions(perms: Permissions | null) {
    this._props = Role.validate({ ...this._props, permissions: perms });
  }

  softDelete() {
    this._props = Role.validate({ ...this._props, deleted: true, deletedAt: new Date() });
  }
}
