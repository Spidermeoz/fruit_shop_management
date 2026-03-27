// src/domain/users/User.ts
import type { UserStatus } from "./types";

export interface UserProps {
  id?: number;

  // FK → roles.id
  roleId?: number | null;

  fullName?: string | null;
  email: string;

  // Domain không giữ plain password; khi cần hash sẽ set vào đây
  passwordHash?: string;

  apiToken?: string | null;
  phone?: string | null;
  avatar?: string | null;

  status?: UserStatus;

  // Soft delete
  deleted?: boolean;
  deletedAt?: Date | null;

  createdAt?: Date;
  updatedAt?: Date;

  // read-only embed (khi include role)
  role?: { id: number; title: string } | null;
}

export class User {
  private _props: UserProps;

  private constructor(props: UserProps) {
    this._props = User.validate(props);
  }

  static create(props: UserProps) {
    return new User(props);
  }

  get props(): Readonly<UserProps> {
    return this._props;
  }

  static validate(p: UserProps): UserProps {
    if (!p.email || !String(p.email).trim()) {
      throw new Error("User.email is required");
    }
    const email = String(p.email).trim().toLowerCase();

    const status: UserStatus = (p.status as UserStatus) ?? "active";

    return {
      ...p,
      email,
      status,
      roleId: p.roleId ?? null,
      fullName: p.fullName ?? null,
      apiToken: p.apiToken ?? null,
      phone: p.phone ?? null,
      branchAssignments: p.branchAssignments ?? [],
      primaryBranchId:
        p.primaryBranchId ??
        p.branchAssignments?.find((x) => x.isPrimary)?.branchId ??
        null,
      avatar: p.avatar ?? null,
      deleted: p.deleted ?? false,
      deletedAt: p.deletedAt ?? null,
    };
  }

  rename(fullName: string | null) {
    this._props = User.validate({ ...this._props, fullName });
  }

  moveToRole(roleId: number | null) {
    this._props = User.validate({ ...this._props, roleId });
  }

  changeStatus(status: UserStatus) {
    this._props = User.validate({ ...this._props, status });
  }

  setPasswordHash(hash: string) {
    this._props = User.validate({ ...this._props, passwordHash: hash });
  }
}

export interface UserBranchAssignment {
  branchId: number;
  isPrimary: boolean;
  branch?: {
    id: number;
    name: string;
    code: string;
    status?: string;
  } | null;
}

export interface UserProps {
  id?: number;
  roleId?: number | null;
  fullName?: string | null;
  email: string;
  passwordHash?: string;
  apiToken?: string | null;
  phone?: string | null;
  avatar?: string | null;
  status?: UserStatus;
  deleted?: boolean;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  role?: { id: number; title: string } | null;

  branchAssignments?: UserBranchAssignment[];
  primaryBranchId?: number | null;
}
