import type { UserRepository } from "../../../domain/users/UserRepository";
import type {
  ListUsersFilter,
  UserSort,
  UserTypeFilter,
} from "../../../domain/users/types";
import { toUserDTO, type UserDTO } from "../../users/dto";

export type ListUsersInput = {
  page?: number;
  limit?: number;
  q?: string;
  status?: string;
  includeDeleted?: boolean;
  sort?: UserSort | null;

  userType?: UserTypeFilter;
  branchId?: number | null;

  actor?: {
    roleId?: number | null;
    branchIds?: number[];
  };
};

export type ListUsersOutput = {
  count: number;
  rows: UserDTO[];
};

const normalizeBranchIds = (branchIds?: number[]) =>
  Array.isArray(branchIds)
    ? branchIds.map(Number).filter((x) => Number.isFinite(x) && x > 0)
    : [];

const isSuperAdminLike = (roleId?: number | null) => Number(roleId) === 1;

export class ListUsers {
  constructor(private repo: UserRepository) {}

  async execute(input: ListUsersInput = {}): Promise<ListUsersOutput> {
    const page = Math.max(input.page ?? 1, 1);
    const limit = Math.min(Math.max(input.limit ?? 10, 1), 100);
    const offset = (page - 1) * limit;

    const actorBranchIds = normalizeBranchIds(input.actor?.branchIds);
    const canViewAllInternalUsers = isSuperAdminLike(input.actor?.roleId);

    const normalizedBranchId =
      input.branchId !== undefined &&
      input.branchId !== null &&
      Number.isFinite(Number(input.branchId)) &&
      Number(input.branchId) > 0
        ? Number(input.branchId)
        : null;

    const filter: ListUsersFilter = {
      q: input.q?.trim() || undefined,
      status: input.status,
      includeDeleted: !!input.includeDeleted,
      sort: input.sort ?? undefined,
      limit,
      offset,
      userType: input.userType ?? "all",
      branchId: normalizedBranchId,
      viewerRoleId:
        input.actor?.roleId !== undefined ? Number(input.actor.roleId) : null,
      allowedBranchIds: actorBranchIds,
      canViewAllInternalUsers,
    };

    const { rows, count } = await this.repo.list(filter);

    return {
      count,
      rows: rows.map(toUserDTO),
    };
  }
}
