import type { User } from "../../../domain/users/User";
import type { AuthUserView } from "../../../domain/auth/types";

export const toAuthUserView = (
  u: User,
): AuthUserView & {
  branch_ids: number[];
  primary_branch_id: number | null;
  branches: Array<{
    id: number;
    name: string;
    code: string;
    status?: string;
    is_primary: boolean;
  }>;
} => {
  const branchAssignments = Array.isArray(u.props.branchAssignments)
    ? u.props.branchAssignments
    : [];

  const branches = branchAssignments
    .filter((x) => x?.branch && x.branchId)
    .map((x) => ({
      id: Number(x.branch!.id),
      name: String(x.branch!.name),
      code: String(x.branch!.code),
      status: x.branch!.status,
      is_primary: !!x.isPrimary,
    }));

  const branchIds = branchAssignments
    .map((x) => Number(x.branchId))
    .filter((x) => Number.isFinite(x) && x > 0);

  const primaryBranchId =
    u.props.primaryBranchId ??
    branchAssignments.find((x) => x.isPrimary)?.branchId ??
    null;

  return {
    id: u.props.id!,
    role_id: u.props.roleId ?? null,
    full_name: u.props.fullName ?? null,
    email: u.props.email,
    phone: u.props.phone ?? null,
    avatar: u.props.avatar ?? null,
    status: u.props.status!,
    deleted: !!u.props.deleted,
    deleted_at: u.props.deletedAt ?? null,
    created_at: u.props.createdAt!,
    updated_at: u.props.updatedAt!,
    role: u.props.role
      ? { id: u.props.role.id, title: u.props.role.title }
      : null,
    branch_ids: branchIds,
    primary_branch_id: primaryBranchId ? Number(primaryBranchId) : null,
    branches,
  };
};
