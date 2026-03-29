import type { UserRepository } from "../../../domain/users/UserRepository";

const mapUserView = (u: any) => ({
  id: u.props.id!,
  roleId: u.props.roleId ?? null,
  fullName: u.props.fullName ?? null,
  email: u.props.email,
  phone: u.props.phone ?? null,
  avatar: u.props.avatar ?? null,
  status: u.props.status!,
  deleted: !!u.props.deleted,
  deletedAt: u.props.deletedAt ?? null,
  createdAt: u.props.createdAt!,
  updatedAt: u.props.updatedAt!,
  role: u.props.role
    ? { id: u.props.role.id, title: u.props.role.title }
    : null,
  primaryBranchId:
    u.props.primaryBranchId ??
    u.props.branchAssignments?.find((x: any) => x.isPrimary)?.branchId ??
    null,
  branchAssignments: Array.isArray(u.props.branchAssignments)
    ? u.props.branchAssignments.map((x: any) => ({
        branchId: Number(x.branchId),
        isPrimary: !!x.isPrimary,
        branch: x.branch
          ? {
              id: Number(x.branch.id),
              name: x.branch.name,
              code: x.branch.code,
              status: x.branch.status,
            }
          : null,
      }))
    : [],
});

const normalizeBranchIds = (branchIds?: number[]) =>
  Array.isArray(branchIds)
    ? branchIds.map(Number).filter((x) => Number.isFinite(x) && x > 0)
    : [];

const isSuperAdminLike = (roleId?: number | null) => Number(roleId) === 1;

const hasBranchOverlap = (user: any, allowedBranchIds: number[]) => {
  const targetBranchIds = Array.isArray(user?.props?.branchAssignments)
    ? user.props.branchAssignments
        .map((x: any) => Number(x.branchId))
        .filter((x: number) => Number.isFinite(x) && x > 0)
    : [];

  return targetBranchIds.some((branchId: number) =>
    allowedBranchIds.includes(branchId),
  );
};

export class GetUserDetail {
  constructor(private repo: UserRepository) {}

  async execute(
    id: number,
    includeDeleted = false,
    actor?: {
      roleId?: number | null;
      branchIds?: number[];
    },
  ) {
    const u = await this.repo.findById(id, includeDeleted);
    if (!u) return null;

    const isInternalUser =
      u.props.roleId !== null && u.props.roleId !== undefined;

    if (isInternalUser && !isSuperAdminLike(actor?.roleId)) {
      const allowedBranchIds = normalizeBranchIds(actor?.branchIds);

      if (!allowedBranchIds.length || !hasBranchOverlap(u, allowedBranchIds)) {
        throw new Error("Bạn không có quyền xem người dùng này");
      }
    }

    return mapUserView(u);
  }
}
