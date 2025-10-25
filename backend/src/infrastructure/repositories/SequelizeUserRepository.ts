// src/infrastructure/repositories/SequelizeUserRepository.ts
import { Op, WhereOptions, OrderItem } from "sequelize";
import { User } from "../../domain/users/User";
import type {
  UserRepository,
  CreateUserInput,
  UpdateUserPatch,
} from "../../domain/users/UserRepository";
import type { ListUsersFilter, UserSort } from "../../domain/users/types";

type Models = { User: any; Role?: any };

const toBool = (v: any) => v === true || v === 1 || v === "1";

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

  // Sequelize → Domain
  private mapRow = (r: any): User =>
    User.create({
      id: Number(r.id),
      roleId: r.role_id ?? null,
      fullName: r.full_name ?? null,
      email: r.email,
      // password: không map ra domain (không trả về)
      apiToken: r.api_token ?? null,
      phone: r.phone ?? null,
      avatar: r.avatar ?? null,
      status: r.status,
      deleted: toBool(r.deleted),
      deletedAt: r.deleted_at ?? r.deletedAt ?? null,
      createdAt: r.created_at ?? r.createdAt,
      updatedAt: r.updated_at ?? r.updatedAt,
      // embed role (include: {as:"role"})
      role: r.role ? { id: Number(r.role.id), title: String(r.role.title) } : null,
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

    const include = this.models.Role
      ? [{ model: this.models.Role, as: "role", attributes: ["id", "title"] }]
      : [];

    const { rows, count } = await this.models.User.findAndCountAll({
      where,
      include,
      order: mapSort(filter?.sort),
      limit: filter?.limit ?? 10,
      offset: filter?.offset ?? 0,
    });

    return { rows: rows.map(this.mapRow), count };
  }

  async findById(id: number, includeDeleted = false) {
    const where: WhereOptions = { id };
    if (!includeDeleted) (where as any).deleted = 0;

    const include = this.models.Role
      ? [{ model: this.models.Role, as: "role", attributes: ["id", "title"] }]
      : [];

    const r = await this.models.User.findOne({ where, include });
    return r ? this.mapRow(r) : null;
  }

  async findByEmail(email: string) {
    const r = await this.models.User.findOne({
      where: { email: email.trim().toLowerCase(), deleted: 0 },
      include: this.models.Role
        ? [{ model: this.models.Role, as: "role", attributes: ["id", "title"] }]
        : [],
    });
    return r ? this.mapRow(r) : null;
  }

  async create(input: CreateUserInput) {
    const r = await this.models.User.create({
      role_id: input.roleId ?? null,
      full_name: input.fullName ?? null,
      email: input.email.trim().toLowerCase(),
      password: input.passwordHash, // hash đã được tạo ở use case
      phone: input.phone ?? null,
      avatar: input.avatar ?? null,
      status: input.status ?? "active",
      deleted: 0,
      deleted_at: null,
    });

    // Lấy lại với include role để trả về đúng embed
    const found = await this.models.User.findByPk(r.id, {
      include: this.models.Role
        ? [{ model: this.models.Role, as: "role", attributes: ["id", "title"] }]
        : [],
    });
    if (!found) throw new Error("User not found after create");
    return this.mapRow(found);
  }

  async update(id: number, patch: UpdateUserPatch) {
    const values: any = {};
    if (patch.roleId !== undefined) values.role_id = patch.roleId;
    if (patch.fullName !== undefined) values.full_name = patch.fullName ?? null;
    if (patch.email !== undefined) values.email = patch.email.trim().toLowerCase();
    if (patch.passwordHash !== undefined) {
      if (patch.passwordHash) values.password = patch.passwordHash; // chỉ khi có hash mới
    }
    if (patch.phone !== undefined) values.phone = patch.phone ?? null;
    if (patch.avatar !== undefined) values.avatar = patch.avatar ?? null;
    if (patch.status !== undefined) values.status = patch.status;

    await this.models.User.update(values, { where: { id } });

    const r = await this.models.User.findByPk(id, {
      include: this.models.Role
        ? [{ model: this.models.Role, as: "role", attributes: ["id", "title"] }]
        : [],
    });
    if (!r) throw new Error("User not found after update");
    return this.mapRow(r);
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
      { where: { id } }
    );

    return {
      id: Number(id),
      fullName: r.full_name ?? null,
      email: r.email,
      deletedAt: now,
    };
  }

  // Bulk: 'status' | 'role' | 'delete' | 'restore'
  async bulkEdit(ids: number[], action: "status" | "role" | "delete" | "restore", value?: any) {
    if (!Array.isArray(ids) || !ids.length) return { affected: 0 };

    const where = { id: { [Op.in]: ids } };

    switch (action) {
      case "status": {
        if (!["active", "inactive"].includes(String(value))) {
          return { affected: 0 };
        }
        const [affected] = await this.models.User.update(
          { status: String(value) },
          { where }
        );
        return { affected: affected ?? 0 };
      }

      case "role": {
        // value: roleId (number | null)
        const [affected] = await this.models.User.update(
          { role_id: value ?? null },
          { where }
        );
        return { affected: affected ?? 0 };
      }

      case "delete": {
        const now = new Date();
        const [affected] = await this.models.User.update(
          { deleted: 1, deleted_at: now },
          { where }
        );
        return { affected: affected ?? 0 };
      }

      case "restore": {
        const [affected] = await this.models.User.update(
          { deleted: 0, deleted_at: null },
          { where }
        );
        return { affected: affected ?? 0 };
      }
    }
  }
}
