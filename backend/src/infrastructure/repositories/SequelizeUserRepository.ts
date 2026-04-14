import { Op, WhereOptions, OrderItem } from "sequelize";
import { User } from "../../domain/users/User";
import type {
  UserRepository,
  CreateUserInput,
  UpdateUserPatch,
} from "../../domain/users/UserRepository";
import type { ListUsersFilter, UserSort } from "../../domain/users/types";

type Models = {
  User: any;
  Role?: any;
  UserBranch?: any;
  Branch?: any;
};

const toBool = (v: any) => v === true || v === 1 || v === "1";

const normalizeBranchIds = (branchIds?: number[]) =>
  Array.isArray(branchIds)
    ? branchIds.map(Number).filter((x) => Number.isFinite(x) && x > 0)
    : [];

const normalizeRoleCode = (value: unknown): string | null => {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase();
  return raw || null;
};

const mapSort = (sort?: UserSort): OrderItem[] => {
  if (!sort) return [["id", "DESC"]];
  const colMap: Record<string, string> = {
    id: "id",
    full_name: "full_name",
    email: "email",
    phone: "phone",
    status: "status",
    created_at: "created_at",
    updated_at: "updated_at",
  };
  const col = colMap[sort.column] ?? "id";
  const dir = sort.dir === "ASC" ? "ASC" : "DESC";
  return [[col, dir]];
};

export class SequelizeUserRepository implements UserRepository {
  constructor(private models: Models) {}

  private roleInclude() {
    if (!this.models.Role) return [];
    return [
      {
        model: this.models.Role,
        as: "role",
        attributes: [
          "id",
          "code",
          "scope",
          "level",
          "is_assignable",
          "is_protected",
          "title",
        ],
      },
    ];
  }

  private branchInclude() {
    if (!this.models.UserBranch || !this.models.Branch) return [];
    return [
      {
        model: this.models.UserBranch,
        as: "userBranches",
        include: [
          {
            model: this.models.Branch,
            as: "branch",
            attributes: ["id", "name", "code", "status"],
          },
        ],
      },
    ];
  }

  private buildIncludes() {
    return [...this.roleInclude(), ...this.branchInclude()];
  }

  private mapRow = (r: any): User =>
    User.create({
      id: Number(r.id),
      roleId: r.role_id ?? null,
      fullName: r.full_name ?? null,
      email: r.email,
      apiToken: r.api_token ?? null,
      phone: r.phone ?? null,
      avatar: r.avatar ?? null,
      status: r.status,
      deleted: toBool(r.deleted),
      deletedAt: r.deleted_at ?? r.deletedAt ?? null,
      createdAt: r.created_at ?? r.createdAt,
      updatedAt: r.updated_at ?? r.updatedAt,
      role: r.role
        ? {
            id: Number(r.role.id),
            code: normalizeRoleCode(r.role.code),
            scope:
              r.role.scope === "system" ||
              r.role.scope === "branch" ||
              r.role.scope === "client"
                ? r.role.scope
                : null,
            level:
              r.role.level === null || r.role.level === undefined
                ? null
                : Number(r.role.level),
            isAssignable:
              r.role.is_assignable === null ||
              r.role.is_assignable === undefined
                ? null
                : toBool(r.role.is_assignable),
            isProtected:
              r.role.is_protected === null || r.role.is_protected === undefined
                ? null
                : toBool(r.role.is_protected),
            title: String(r.role.title),
          }
        : null,
      branchAssignments: Array.isArray(r.userBranches)
        ? r.userBranches.map((ub: any) => ({
            branchId: Number(ub.branch_id),
            isPrimary: toBool(ub.is_primary),
            branch: ub.branch
              ? {
                  id: Number(ub.branch.id),
                  name: String(ub.branch.name),
                  code: String(ub.branch.code),
                  status: ub.branch.status,
                }
              : null,
          }))
        : [],
      primaryBranchId: Array.isArray(r.userBranches)
        ? Number(
            r.userBranches.find((ub: any) => toBool(ub.is_primary))
              ?.branch_id ?? 0,
          ) || null
        : null,
    });

  async list(filter: ListUsersFilter) {
    const where: WhereOptions = {};
    if (!filter?.includeDeleted) (where as any).deleted = 0;

    if (filter?.status && filter.status !== "all") {
      (where as any).status = filter.status;
    }

    if (filter?.q && filter.q.trim()) {
      const q = filter.q.trim();
      (where as any)[Op.or] = [
        { email: { [Op.like]: `%${q}%` } },
        { full_name: { [Op.like]: `%${q}%` } },
        { phone: { [Op.like]: `%${q}%` } },
      ];
    }

    // Tách customer / internal
    if (filter?.userType === "internal") {
      (where as any).role_id = { [Op.ne]: null };
    } else if (filter?.userType === "customer") {
      (where as any).role_id = null;
    }

    const allowedBranchIds = normalizeBranchIds(filter?.allowedBranchIds);
    const hasBranchScope =
      !filter?.canViewAllInternalUsers &&
      (filter?.userType === "internal" || filter?.userType === "all");

    const requestedBranchId =
      filter?.branchId !== undefined &&
      filter?.branchId !== null &&
      Number(filter.branchId) > 0
        ? Number(filter.branchId)
        : null;

    const userBranchInclude =
      this.models.UserBranch && this.models.Branch
        ? {
            model: this.models.UserBranch,
            as: "userBranches",
            required: false,
            include: [
              {
                model: this.models.Branch,
                as: "branch",
                attributes: ["id", "name", "code", "status"],
              },
            ],
          }
        : null;

    const include: any[] = [];
    if (this.models.Role) {
      include.push({
        model: this.models.Role,
        as: "role",
        attributes: [
          "id",
          "code",
          "scope",
          "level",
          "is_assignable",
          "is_protected",
          "title",
        ],
      });
    }

    if (userBranchInclude) {
      // branch filter explicit
      if (requestedBranchId && filter?.userType !== "customer") {
        include.push({
          ...userBranchInclude,
          required: true,
          where: { branch_id: requestedBranchId },
        });
      }
      // actor scope on internal users
      else if (
        hasBranchScope &&
        allowedBranchIds.length &&
        filter?.userType !== "customer"
      ) {
        include.push({
          ...userBranchInclude,
          required: true,
          where: {
            branch_id: {
              [Op.in]: allowedBranchIds,
            },
          },
        });
      } else {
        include.push(userBranchInclude);
      }
    }

    const { rows, count } = await this.models.User.findAndCountAll({
      where,
      include,
      distinct: true,
      order: mapSort(filter?.sort),
      limit: filter?.limit ?? 10,
      offset: filter?.offset ?? 0,
    });

    return { rows: rows.map(this.mapRow), count };
  }

  async findById(id: number, includeDeleted = false) {
    const where: WhereOptions = { id };
    if (!includeDeleted) (where as any).deleted = 0;

    const r = await this.models.User.findOne({
      where,
      include: this.buildIncludes(),
    });

    return r ? this.mapRow(r) : null;
  }

  async findByEmail(email: string) {
    const r = await this.models.User.findOne({
      where: { email: email.trim().toLowerCase(), deleted: 0 },
      include: this.buildIncludes(),
    });
    return r ? this.mapRow(r) : null;
  }

  async create(input: CreateUserInput) {
    const r = await this.models.User.create({
      role_id: input.roleId ?? null,
      full_name: input.fullName ?? null,
      email: input.email.trim().toLowerCase(),
      password: input.passwordHash,
      phone: input.phone ?? null,
      avatar: input.avatar ?? null,
      status: input.status ?? "active",
      deleted: 0,
      deleted_at: null,
    });

    if (input.branchAssignments !== undefined) {
      await this.setUserBranches(Number(r.id), input.branchAssignments);
    }

    const found = await this.models.User.findByPk(r.id, {
      include: this.buildIncludes(),
    });
    if (!found) throw new Error("User not found after create");
    return this.mapRow(found);
  }

  async update(id: number, patch: UpdateUserPatch) {
    const values: any = {};
    if (patch.roleId !== undefined) values.role_id = patch.roleId;
    if (patch.fullName !== undefined) values.full_name = patch.fullName ?? null;
    if (patch.email !== undefined) {
      values.email = patch.email.trim().toLowerCase();
    }
    if (patch.passwordHash !== undefined) {
      if (patch.passwordHash) values.password = patch.passwordHash;
    }
    if (patch.phone !== undefined) values.phone = patch.phone ?? null;
    if (patch.avatar !== undefined) values.avatar = patch.avatar ?? null;
    if (patch.status !== undefined) values.status = patch.status;

    await this.models.User.update(values, { where: { id } });

    if (patch.branchAssignments !== undefined) {
      await this.setUserBranches(id, patch.branchAssignments);
    }

    const r = await this.models.User.findByPk(id, {
      include: this.buildIncludes(),
    });
    if (!r) throw new Error("User not found after update");
    return this.mapRow(r);
  }

  async setUserBranches(
    userId: number,
    assignments: { branchId: number; isPrimary?: boolean }[],
  ): Promise<void> {
    if (!this.models.UserBranch) return;

    const normalizedInput = Array.isArray(assignments)
      ? assignments
          .filter((x) => Number(x?.branchId) > 0)
          .map((x) => ({
            branchId: Number(x.branchId),
            isPrimary: x.isPrimary === true,
          }))
      : [];

    const hasPrimary = normalizedInput.some((x) => x.isPrimary);
    const normalized = normalizedInput.map((x, idx) => ({
      user_id: userId,
      branch_id: x.branchId,
      is_primary: x.isPrimary || (!hasPrimary && idx === 0),
    }));

    await this.models.UserBranch.destroy({ where: { user_id: userId } });

    if (normalized.length) {
      await this.models.UserBranch.bulkCreate(normalized);
    }
  }

  async getUserBranches(userId: number) {
    if (!this.models.UserBranch) return [];

    const rows = await this.models.UserBranch.findAll({
      where: { user_id: userId },
      order: [
        ["is_primary", "DESC"],
        ["id", "ASC"],
      ],
    });

    return rows.map((r: any) => ({
      branchId: Number(r.branch_id),
      isPrimary: toBool(r.is_primary),
    }));
  }

  async updateStatus(id: number, status: "active" | "inactive") {
    await this.models.User.update({ status }, { where: { id } });

    const r = await this.models.User.findByPk(id);
    if (!r) throw new Error("User not found after updateStatus");

    return {
      id: Number(r.id),
      fullName: r.full_name ?? null,
      email: r.email,
      status: r.status as "active" | "inactive" | "banned",
    };
  }

  async softDelete(id: number) {
    const now = new Date();
    const r = await this.models.User.findByPk(id);
    if (!r) throw new Error("User not found");

    await this.models.User.update(
      { deleted: 1, deleted_at: now },
      { where: { id } },
    );

    return {
      id: Number(id),
      fullName: r.full_name ?? null,
      email: r.email,
      deletedAt: now,
    };
  }

  async bulkEdit(
    ids: number[],
    action: "status" | "role" | "delete" | "restore",
    value?: any,
  ) {
    if (!Array.isArray(ids) || !ids.length) return { affected: 0 };

    const where = { id: { [Op.in]: ids } };

    switch (action) {
      case "status": {
        if (!["active", "inactive"].includes(String(value))) {
          return { affected: 0 };
        }
        const [affected] = await this.models.User.update(
          { status: String(value) },
          { where },
        );
        return { affected: affected ?? 0 };
      }

      case "role": {
        const [affected] = await this.models.User.update(
          { role_id: value ?? null },
          { where },
        );
        return { affected: affected ?? 0 };
      }

      case "delete": {
        const now = new Date();
        const [affected] = await this.models.User.update(
          { deleted: 1, deleted_at: now },
          { where },
        );
        return { affected: affected ?? 0 };
      }

      case "restore": {
        const [affected] = await this.models.User.update(
          { deleted: 0, deleted_at: null },
          { where },
        );
        return { affected: affected ?? 0 };
      }
    }
  }

  async updateApiToken(
    userId: number,
    tokenHash: string | null,
  ): Promise<void> {
    await this.models.User.update(
      { api_token: tokenHash ?? null },
      { where: { id: userId } },
    );
  }

  async findAuthByEmail(email: string) {
    const where: any = { email: email.trim().toLowerCase(), deleted: 0 };

    const r = await this.models.User.findOne({
      where,
      include: this.buildIncludes(),
    });

    if (!r) return null;

    const user = this.mapRow(r);
    const passwordHash: string = String(r.password);
    return { user, passwordHash };
  }

  async findByApiTokenHash(hash: string) {
    const r = await this.models.User.findOne({
      where: { api_token: hash, deleted: 0 },
      include: this.buildIncludes(),
    });

    return r ? this.mapRow(r) : null;
  }
}
