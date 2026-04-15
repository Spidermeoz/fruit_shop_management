import type { User } from "../../../domain/users/User";
import type { AuthUserView } from "../../../domain/auth/types";

export const toAuthUserView = (
  u: User,
): AuthUserView & {
  role_code: string | null;
  role_scope: "system" | "branch" | "client" | null;
  role_level: number | null;
  is_super_admin: boolean;
  permissions: Record<string, string[]> | null;
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

  const role = u.props.role ?? null;

  const roleCode = role?.code ? String(role.code).trim().toLowerCase() : null;

  const roleScope =
    role?.scope === "system" ||
    role?.scope === "branch" ||
    role?.scope === "client"
      ? role.scope
      : null;

  const roleLevel =
    role?.level === null || role?.level === undefined
      ? null
      : Number(role.level);

  const isSuperAdmin = roleCode === "super_admin";
  
  const normalizePermissions = (
    value: unknown,
  ): Record<string, string[]> | null => {
    if (value == null) return null;

    let rawObject: Record<string, unknown> | null = null;

    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          rawObject = parsed as Record<string, unknown>;
        } else {
          return null;
        }
      } catch {
        return null;
      }
    } else if (typeof value === "object" && !Array.isArray(value)) {
      rawObject = value as Record<string, unknown>;
    } else {
      return null;
    }

    return Object.fromEntries(
      Object.entries(rawObject).map(([module, actions]) => [
        String(module).trim().toLowerCase(),
        Array.isArray(actions)
          ? actions.map((action) => String(action).trim().toLowerCase())
          : [],
      ]),
    );
  };

  const permissions = normalizePermissions(role?.permissions);


  return {
    id: u.props.id!,
    role_id: u.props.roleId ?? null,
    role_code: roleCode,
    role_scope: roleScope,
    role_level: roleLevel,
    is_super_admin: isSuperAdmin,
    permissions,
    full_name: u.props.fullName ?? null,
    email: u.props.email,
    phone: u.props.phone ?? null,
    avatar: u.props.avatar ?? null,
    status: u.props.status!,
    deleted: !!u.props.deleted,
    deleted_at: u.props.deletedAt ?? null,
    created_at: u.props.createdAt!,
    updated_at: u.props.updatedAt!,
    role: role
      ? {
          id: role.id,
          title: role.title,
        }
      : null,
    branch_ids: branchIds,
    primary_branch_id: primaryBranchId ? Number(primaryBranchId) : null,
    branches,
  };
};
