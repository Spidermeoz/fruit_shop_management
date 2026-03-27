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

export class EditUser {
  constructor(private repo: UserRepository) {}

  async execute(id: number, patch: EditUserInput) {
    const existing = await this.repo.findById(id, true);
    if (!existing) {
      throw new Error("User not found");
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
