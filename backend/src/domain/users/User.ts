// src/domain/users/User.ts
import type { UserStatus } from "./types";

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
  role?: {
    id: number;
    code?: string | null;
    scope?: "system" | "branch" | "client" | null;
    level?: number | null;
    permissions?: Record<string, string[]> | null;
    isAssignable?: boolean | null;
    isProtected?: boolean | null;
    title: string;
  } | null;
  branchAssignments?: UserBranchAssignment[];
  primaryBranchId?: number | null;
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
    const branchAssignments = Array.isArray(p.branchAssignments)
      ? p.branchAssignments
          .filter((x) => Number(x?.branchId) > 0)
          .map((x) => ({
            branchId: Number(x.branchId),
            isPrimary: !!x.isPrimary,
            branch: x.branch ?? null,
          }))
      : [];

    const primaryFromAssignments =
      branchAssignments.find((x) => x.isPrimary)?.branchId ?? null;

    return {
      ...p,
      email,
      status,
      roleId: p.roleId ?? null,
      fullName: p.fullName ?? null,
      apiToken: p.apiToken ?? null,
      phone: p.phone ?? null,
      avatar: p.avatar ?? null,
      deleted: p.deleted ?? false,
      deletedAt: p.deletedAt ?? null,
      branchAssignments,
      primaryBranchId:
        p.primaryBranchId !== undefined && p.primaryBranchId !== null
          ? Number(p.primaryBranchId)
          : primaryFromAssignments,
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
