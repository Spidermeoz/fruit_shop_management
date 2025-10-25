// src/application/users/usecases/ListUsers.ts
import type { UserRepository } from "../../../domain/users/UserRepository";
import type { ListUsersFilter, UserSort } from "../../../domain/users/types";
import { toUserDTO, type UserDTO } from "../../users/dto";

export type ListUsersInput = {
  page?: number;   // 1-based
  limit?: number;
  q?: string;
  status?: string;           // "active" | "inactive" | "banned" | "all"
  includeDeleted?: boolean;
  sort?: UserSort | null;    // { column, dir }
};

export type ListUsersOutput = {
  count: number;
  rows: UserDTO[];
};

export class ListUsers {
  constructor(private repo: UserRepository) {}

  async execute(input: ListUsersInput = {}): Promise<ListUsersOutput> {
    const page = Math.max(input.page ?? 1, 1);
    const limit = Math.min(Math.max(input.limit ?? 10, 1), 100);
    const offset = (page - 1) * limit;

    const filter: ListUsersFilter = {
      q: input.q?.trim() || undefined,
      status: input.status,
      includeDeleted: !!input.includeDeleted,
      sort: input.sort ?? undefined,
      limit,
      offset,
    };

    const { rows, count } = await this.repo.list(filter);
    return {
      count,
      rows: rows.map(toUserDTO),
    };
  }
}
