import type { User } from "./User";
import type { ListUsersFilter, UserStatus } from "./types";

export type UserBranchAssignmentInput = {
  branchId: number;
  isPrimary?: boolean;
};

export type CreateUserInput = {
  roleId?: number | null;
  fullName?: string | null;
  email: string;
  passwordHash: string;
  phone?: string | null;
  avatar?: string | null;
  status?: UserStatus;
  branchAssignments?: UserBranchAssignmentInput[];
};

export type UpdateUserPatch = Partial<{
  roleId: number | null;
  fullName: string | null;
  email: string;
  passwordHash: string | null;
  phone: string | null;
  avatar: string | null;
  status: UserStatus;
  branchAssignments: UserBranchAssignmentInput[];
}>;

export interface UserRepository {
  list(filter: ListUsersFilter): Promise<{ rows: User[]; count: number }>;
  findById(id: number, includeDeleted?: boolean): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(input: CreateUserInput): Promise<User>;
  update(id: number, patch: UpdateUserPatch): Promise<User>;

  setUserBranches(
    userId: number,
    assignments: UserBranchAssignmentInput[],
  ): Promise<void>;

  getUserBranches(userId: number): Promise<UserBranchAssignmentInput[]>;

  updateStatus(
    id: number,
    status: Extract<UserStatus, "active" | "inactive">,
  ): Promise<{
    id: number;
    fullName: string | null;
    email: string;
    status: UserStatus;
  }>;

  softDelete(id: number): Promise<{
    id: number;
    fullName: string | null;
    email: string;
    deletedAt: Date;
  }>;

  bulkEdit(
    ids: number[],
    action: "status" | "role" | "delete" | "restore",
    value?: any,
  ): Promise<{ affected: number }>;

  updateApiToken(userId: number, tokenHash: string | null): Promise<void>;

  findAuthByEmail(
    email: string,
  ): Promise<{ user: User; passwordHash: string } | null>;

  findByApiTokenHash(hash: string): Promise<User | null>;
}
