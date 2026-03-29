import bcrypt from "bcryptjs";
import type {
  UserRepository,
  UpdateUserPatch,
} from "../../../domain/users/UserRepository";

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

const isSuperAdminLike = (roleId?: number | null) => Number(roleId) === 1;

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
  actor?: { roleId?: number | null; branchIds?: number[] },
) => {
  if (isSuperAdminLike(actor?.roleId)) return;

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

export class EditUser {
  constructor(private repo: UserRepository) {}

  async execute(
    id: number,
    patch: EditUserInput,
    actor?: {
      roleId?: number | null;
      branchIds?: number[];
    },
  ) {
    const existing = await this.repo.findById(id, true);
    if (!existing) {
      throw new Error("User not found");
    }

    const existingIsInternal =
      existing.props.roleId !== null && existing.props.roleId !== undefined;

    if (existingIsInternal && !isSuperAdminLike(actor?.roleId)) {
      const allowedBranchIds = normalizeBranchIds(actor?.branchIds);
      if (
        !allowedBranchIds.length ||
        !hasBranchOverlap(existing, allowedBranchIds)
      ) {
        throw new Error("Bạn không có quyền chỉnh sửa người dùng này");
      }
    }

    const outPatch: UpdateUserPatch = {};

    const nextRoleId =
      patch.roleId !== undefined
        ? patch.roleId
        : (existing.props.roleId ?? null);

    if (patch.roleId !== undefined) outPatch.roleId = nextRoleId;
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
    return { id: updated.props.id!, user: mapUserView(updated) };
  }
}
