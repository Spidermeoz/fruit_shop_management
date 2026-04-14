import bcrypt from "bcryptjs";
import type { UserRepository } from "../../../domain/users/UserRepository";
import type { RoleRepository } from "../../../domain/roles/RoleRepository";
import type { Role } from "../../../domain/roles/Role";

export type CreateUserInput = {
  roleId?: number | null;
  fullName?: string | null;
  email: string;
  password: string;
  phone?: string | null;
  avatar?: string | null;
  status?: "active" | "inactive" | "banned";
  branchAssignments?: Array<{
    branchId: number;
    isPrimary?: boolean;
  }>;
};

type ActorContext = {
  roleId?: number | null;
  roleCode?: string | null;
  roleScope?: "system" | "branch" | "client" | null;
  roleLevel?: number | null;
  isRoleProtected?: boolean;
  isSuperAdmin?: boolean;
  branchIds?: number[];
};

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
    ? {
        id: u.props.role.id,
        code: u.props.role.code ?? null,
        scope: u.props.role.scope ?? null,
        level: u.props.role.level ?? null,
        isAssignable: u.props.role.isAssignable ?? null,
        isProtected: u.props.role.isProtected ?? null,
        title: u.props.role.title,
      }
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

type BranchAssignmentInput = {
  branchId: number;
  isPrimary?: boolean;
};

const normalizeBranchAssignments = (
  assignments?: BranchAssignmentInput[],
): Array<{ branchId: number; isPrimary: boolean }> => {
  if (!Array.isArray(assignments)) return [];

  const deduped = new Map<number, { branchId: number; isPrimary: boolean }>();

  for (const item of assignments) {
    const branchId = Number(item?.branchId);
    if (!Number.isFinite(branchId) || branchId <= 0) continue;

    const prev = deduped.get(branchId);
    deduped.set(branchId, {
      branchId,
      isPrimary: !!item?.isPrimary || !!prev?.isPrimary,
    });
  }

  return Array.from(deduped.values());
};

const ensureValidStaffBranches = (
  assignments: Array<{ branchId: number; isPrimary: boolean }>,
) => {
  if (assignments.length === 0) {
    throw new Error("Staff/Admin bắt buộc phải được gán ít nhất 1 chi nhánh.");
  }

  const primaryCount = assignments.filter((x) => x.isPrimary).length;

  if (primaryCount !== 1) {
    throw new Error("Staff/Admin bắt buộc phải có đúng 1 chi nhánh chính.");
  }
};

const normalizeBranchIds = (branchIds?: number[]) =>
  Array.isArray(branchIds)
    ? branchIds.map(Number).filter((x) => Number.isFinite(x) && x > 0)
    : [];

const isSuperAdminActor = (actor?: ActorContext) =>
  actor?.isSuperAdmin === true || actor?.roleCode === "super_admin";

const normalizeActorLevel = (actor?: ActorContext) => {
  const value = actor?.roleLevel;
  if (value === null || value === undefined) return null;

  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const ensureAssignmentsWithinScope = (
  assignments: Array<{ branchId: number; isPrimary: boolean }>,
  actor?: ActorContext,
) => {
  if (isSuperAdminActor(actor)) return;

  const allowedBranchIds = normalizeBranchIds(actor?.branchIds);
  if (!allowedBranchIds.length) {
    throw new Error("Bạn không có quyền gán chi nhánh cho nhân sự nội bộ.");
  }

  const invalid = assignments.some(
    (x) => !allowedBranchIds.includes(x.branchId),
  );
  if (invalid) {
    throw new Error(
      "Bạn chỉ có thể gán người dùng vào các chi nhánh mình quản lý.",
    );
  }
};

const ensureTargetRoleCanBeAssigned = (
  targetRole: Role | null,
  actor?: ActorContext,
) => {
  if (!targetRole) {
    throw new Error("Role không tồn tại.");
  }

  if (targetRole.props.deleted) {
    throw new Error("Role đã bị xóa hoặc ngừng sử dụng.");
  }

  if (!targetRole.props.isAssignable) {
    throw new Error(
      "Role này không được phép gán từ màn hình quản lý người dùng.",
    );
  }

  if (targetRole.props.isProtected) {
    throw new Error("Role này được bảo vệ và không thể gán từ luồng hiện tại.");
  }

  if (isSuperAdminActor(actor)) {
    return;
  }

  const actorLevel = normalizeActorLevel(actor);
  if (actorLevel === null) {
    throw new Error("Không xác định được cấp quyền của tài khoản hiện tại.");
  }

  if (targetRole.props.scope === "system") {
    throw new Error("Bạn không được phép gán role cấp hệ thống.");
  }

  if (targetRole.props.level >= actorLevel) {
    throw new Error("Bạn chỉ có thể gán role thấp hơn role hiện tại của mình.");
  }
};

export class CreateUser {
  constructor(
    private repo: UserRepository,
    private rolesRepo: RoleRepository,
  ) {}

  async execute(input: CreateUserInput, actor?: ActorContext) {
    const roleId = input.roleId ?? null;

    let targetRole: Role | null = null;
    if (roleId !== null) {
      targetRole = await this.rolesRepo.findById(Number(roleId), false);
      ensureTargetRoleCanBeAssigned(targetRole, actor);
    }

    const normalizedAssignments = normalizeBranchAssignments(
      input.branchAssignments,
    );

    const finalBranchAssignments =
      roleId === null
        ? []
        : (() => {
            ensureValidStaffBranches(normalizedAssignments);
            ensureAssignmentsWithinScope(normalizedAssignments, actor);
            return normalizedAssignments;
          })();

    const passwordHash = await bcrypt.hash(input.password, 10);

    const created = await this.repo.create({
      roleId,
      fullName: input.fullName ?? null,
      email: input.email.trim().toLowerCase(),
      passwordHash,
      phone: input.phone ?? null,
      avatar: input.avatar ?? null,
      status: (input.status as any) ?? "active",
      branchAssignments: finalBranchAssignments,
    });

    return mapUserView(created);
  }
}
