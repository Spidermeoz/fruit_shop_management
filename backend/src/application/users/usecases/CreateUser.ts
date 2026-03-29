import bcrypt from "bcryptjs";
import type { UserRepository } from "../../../domain/users/UserRepository";

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

export class CreateUser {
  constructor(private repo: UserRepository) {}

  async execute(
    input: CreateUserInput,
    actor?: {
      roleId?: number | null;
      branchIds?: number[];
    },
  ) {
    const roleId = input.roleId ?? null;
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
