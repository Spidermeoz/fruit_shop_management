// src/domain/users/UserRepository.ts
import type { User } from "./User";
import type { ListUsersFilter, UserStatus } from "./types";

export type CreateUserInput = {
  roleId?: number | null;
  fullName?: string | null;
  email: string;
  passwordHash: string; // hash sẵn ở use case
  phone?: string | null;
  avatar?: string | null;
  status?: UserStatus;
};

export type UpdateUserPatch = Partial<{
  roleId: number | null;
  fullName: string | null;
  email: string;
  passwordHash: string | null; // nếu không đổi pass → undefined
  phone: string | null;
  avatar: string | null;
  status: UserStatus;
}>;

export interface UserRepository {
  // List + count (để trả meta.total)
  list(filter: ListUsersFilter): Promise<{ rows: User[]; count: number }>;

  // includeDeleted mặc định false
  findById(id: number, includeDeleted?: boolean): Promise<User | null>;

  findByEmail(email: string): Promise<User | null>;

  create(input: CreateUserInput): Promise<User>;

  update(id: number, patch: UpdateUserPatch): Promise<User>;

  updateStatus(
    id: number,
    status: Extract<UserStatus, "active" | "inactive">
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

  // Bulk: action = 'status' | 'delete'
  bulkEdit(
    ids: number[],
    action: "status" | "role" | "delete" | "restore",
    value?: any
  ): Promise<{ affected: number }>;
}
