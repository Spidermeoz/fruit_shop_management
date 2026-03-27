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

export class CreateUser {
  constructor(private repo: UserRepository) {}

  async execute(input: CreateUserInput) {
    const passwordHash = await bcrypt.hash(input.password, 10);

    const created = await this.repo.create({
      roleId: input.roleId ?? null,
      fullName: input.fullName ?? null,
      email: input.email.trim().toLowerCase(),
      passwordHash,
      phone: input.phone ?? null,
      avatar: input.avatar ?? null,
      status: (input.status as any) ?? "active",
      branchAssignments: Array.isArray(input.branchAssignments)
        ? input.branchAssignments
        : [],
    });

    return mapUserView(created);
  }
}
