import bcrypt from "bcryptjs";
import type {
  UserRepository,
  UpdateUserPatch,
} from "../../../domain/users/UserRepository";
import type { RoleRepository } from "../../../domain/roles/RoleRepository";
import type { Role } from "../../../domain/roles/Role";
import type { CreateAuditLog } from "../../audit-logs/usecases/CreateAuditLog";

export type EditUserInput = Partial<{
  roleId: number | null;
  fullName: string | null;
  email: string;
  password: string | null;
  phone: string | null;
  avatar: string | null;
  status: "active" | "inactive" | "banned";
  branchAssignments: Array<{
    branchId: number;
    isPrimary?: boolean;
  }>;
}>;

type ActorContext = {
  id?: number | null;
  roleId?: number | null;
  roleCode?: string | null;
  roleScope?: "system" | "branch" | "client" | null;
  roleLevel?: number | null;
  isRoleProtected?: boolean;
  isSuperAdmin?: boolean;
  branchIds?: number[];
  requestId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
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

const normalizeRoleCode = (value: unknown): string | null => {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase();
  return raw || null;
};

const normalizeNullableRoleId = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;

  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const normalizeUserStatus = (
  value: unknown,
): "active" | "inactive" | "banned" | null => {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase();

  if (raw === "active" || raw === "inactive" || raw === "banned") {
    return raw;
  }

  return null;
};

const hasBranchOverlap = (existing: any, allowedBranchIds: number[]) => {
  const targetBranchIds = Array.isArray(existing?.props?.branchAssignments)
    ? existing.props.branchAssignments
        .map((x: any) => Number(x.branchId))
        .filter((x: number) => Number.isFinite(x) && x > 0)
    : [];

  return targetBranchIds.some((branchId: number) =>
    allowedBranchIds.includes(branchId),
  );
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

  if (targetRole.props.isProtected) {
    throw new Error("Bạn không được phép gán role được bảo vệ.");
  }

  if (targetRole.props.level >= actorLevel) {
    throw new Error("Bạn chỉ có thể gán role thấp hơn role hiện tại của mình.");
  }
};

const ensureTargetUserCanBeManaged = (existing: any, actor?: ActorContext) => {
  const targetRole = existing?.props?.role ?? null;
  const targetRoleCode = normalizeRoleCode(targetRole?.code);

  if (isSuperAdminActor(actor)) {
    return;
  }

  if (targetRoleCode === "super_admin") {
    throw new Error("Bạn không có quyền chỉnh sửa tài khoản Super Admin.");
  }

  if (targetRole?.isProtected) {
    throw new Error(
      "Bạn không có quyền chỉnh sửa tài khoản thuộc role được bảo vệ.",
    );
  }

  const actorLevel = normalizeActorLevel(actor);
  const targetLevel =
    targetRole?.level === null || targetRole?.level === undefined
      ? null
      : Number(targetRole.level);

  if (actorLevel === null) {
    throw new Error("Không xác định được cấp quyền của tài khoản hiện tại.");
  }

  if (
    targetLevel !== null &&
    Number.isFinite(targetLevel) &&
    targetLevel >= actorLevel
  ) {
    throw new Error(
      "Bạn không thể chỉnh sửa tài khoản có role ngang hoặc cao hơn mình.",
    );
  }
};

const pickActorBranchId = (actor?: ActorContext): number | null => {
  const branchIds = normalizeBranchIds(actor?.branchIds);
  return branchIds[0] ?? null;
};

export class EditUser {
  constructor(
    private repo: UserRepository,
    private rolesRepo: RoleRepository,
    private createAuditLog?: CreateAuditLog,
  ) {}

  async execute(id: number, patch: EditUserInput, actor?: ActorContext) {
    const existing = await this.repo.findById(id, true);
    if (!existing) {
      throw new Error("User not found");
    }

    const beforeUser = mapUserView(existing);

    const actorUserId =
      actor?.id !== undefined && actor?.id !== null ? Number(actor.id) : null;

    if (actorUserId !== null && Number(actorUserId) === Number(id)) {
      const currentRoleId = normalizeNullableRoleId(
        existing.props.roleId ?? null,
      );
      const nextRequestedRoleId =
        patch.roleId !== undefined
          ? normalizeNullableRoleId(patch.roleId)
          : currentRoleId;

      const currentStatus = normalizeUserStatus(existing.props.status ?? null);
      const nextRequestedStatus =
        patch.status !== undefined
          ? normalizeUserStatus(patch.status)
          : currentStatus;

      const isTryingToChangeOwnRole =
        patch.roleId !== undefined && nextRequestedRoleId !== currentRoleId;

      const isTryingToDisableOwnAccount =
        patch.status !== undefined &&
        nextRequestedStatus !== currentStatus &&
        (nextRequestedStatus === "inactive" ||
          nextRequestedStatus === "banned");

      if (isTryingToChangeOwnRole || isTryingToDisableOwnAccount) {
        throw new Error(
          "Bạn không thể tự thay đổi role hoặc tự vô hiệu hóa tài khoản của chính mình.",
        );
      }
    }

    const existingIsInternal =
      existing.props.roleId !== null && existing.props.roleId !== undefined;

    if (existingIsInternal) {
      ensureTargetUserCanBeManaged(existing, actor);
    }

    if (existingIsInternal && !isSuperAdminActor(actor)) {
      const allowedBranchIds = normalizeBranchIds(actor?.branchIds);
      if (
        !allowedBranchIds.length ||
        !hasBranchOverlap(existing, allowedBranchIds)
      ) {
        throw new Error("Bạn không có quyền chỉnh sửa người dùng này");
      }
    }

    const outPatch: UpdateUserPatch = {};

    const currentRoleId = normalizeNullableRoleId(
      existing.props.roleId ?? null,
    );

    const nextRoleId =
      patch.roleId !== undefined
        ? normalizeNullableRoleId(patch.roleId)
        : currentRoleId;

    const isActuallyChangingRole =
      patch.roleId !== undefined && nextRoleId !== currentRoleId;

    if (isActuallyChangingRole && nextRoleId !== null) {
      const targetRole = await this.rolesRepo.findById(
        Number(nextRoleId),
        false,
      );

      ensureTargetRoleCanBeAssigned(targetRole, actor);
    }

    if (patch.roleId !== undefined) {
      outPatch.roleId = nextRoleId;
    }
    if (patch.fullName !== undefined) outPatch.fullName = patch.fullName;
    if (patch.email !== undefined) {
      outPatch.email = patch.email.trim().toLowerCase();
    }
    if (patch.phone !== undefined) outPatch.phone = patch.phone;
    if (patch.avatar !== undefined) outPatch.avatar = patch.avatar;
    if (patch.status !== undefined) outPatch.status = patch.status;

    const shouldRecomputeBranches =
      patch.roleId !== undefined || patch.branchAssignments !== undefined;

    if (shouldRecomputeBranches) {
      const sourceAssignments =
        patch.branchAssignments !== undefined
          ? patch.branchAssignments
          : (existing.props.branchAssignments ?? []);

      const normalizedAssignments =
        normalizeBranchAssignments(sourceAssignments);

      if (nextRoleId === null) {
        outPatch.branchAssignments = [];
      } else {
        ensureValidStaffBranches(normalizedAssignments);
        ensureAssignmentsWithinScope(normalizedAssignments, actor);
        outPatch.branchAssignments = normalizedAssignments;
      }
    }

    if (patch.password !== undefined) {
      if (patch.password && patch.password.trim() !== "") {
        outPatch.passwordHash = await bcrypt.hash(patch.password, 10);
      } else {
        outPatch.passwordHash = undefined;
      }
    }

    const updated = await this.repo.update(id, outPatch);
    const afterUser = mapUserView(updated);

    if (this.createAuditLog) {
      await this.createAuditLog.execute({
        actorUserId: actorUserId,
        actorRoleId:
          actor?.roleId !== undefined && actor?.roleId !== null
            ? Number(actor.roleId)
            : null,
        branchId: pickActorBranchId(actor),
        action: "update",
        moduleName: "user",
        entityType: "user",
        entityId: Number(id),
        requestId: actor?.requestId ?? null,
        ipAddress: actor?.ipAddress ?? null,
        userAgent: actor?.userAgent ?? null,
        oldValuesJson: beforeUser,
        newValuesJson: afterUser,
        metaJson: {
          changedFields: Object.keys(outPatch),
        },
      });
    }

    return { id: updated.props.id!, user: afterUser };
  }
}
