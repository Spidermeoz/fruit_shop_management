// src/application/users/dto.ts
import type { User } from "../../domain/users/User";

export type UserDTO = {
  id: number;
  roleId: number | null;
  fullName: string | null;
  email: string;
  phone: string | null;
  avatar: string | null;
  status: "active" | "inactive" | "banned";
  deleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;

  role: { id: number; title: string } | null;

  primaryBranchId: number | null;
  branchAssignments: Array<{
    branchId: number;
    isPrimary: boolean;
    branch: {
      id: number;
      name: string | null;
      code: string | null;
      status: string | null;
    } | null;
  }>;
};

export const toUserDTO = (u: User): UserDTO => ({
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
  role: u.props.role ?? null,

  primaryBranchId:
    u.props.primaryBranchId ??
    u.props.branchAssignments?.find((x) => x.isPrimary)?.branchId ??
    null,

  branchAssignments: Array.isArray(u.props.branchAssignments)
    ? u.props.branchAssignments.map((x) => ({
        branchId: Number(x.branchId),
        isPrimary: !!x.isPrimary,
        branch: x.branch
          ? {
              id: Number(x.branch.id),
              name: x.branch.name ?? null,
              code: x.branch.code ?? null,
              status: x.branch.status ?? null,
            }
          : null,
      }))
    : [],
});
