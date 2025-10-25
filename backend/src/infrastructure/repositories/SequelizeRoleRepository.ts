// src/infrastructure/repositories/SequelizeRoleRepository.ts
import { Op, WhereOptions } from "sequelize";
import { Role } from "../../domain/roles/Role";
import type {
  RoleRepository,
  CreateRoleInput,
  UpdateRolePatch,
} from "../../domain/roles/RoleRepository";
import type { RoleListFilter, Permissions } from "../../domain/roles/types";

type Models = { Role: any };

function toBool(v: any): boolean {
  return v === true || v === 1 || v === "1";
}

function parsePermissions(raw: any): Permissions | null {
  if (raw == null) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as Permissions;
    } catch {
      return null;
    }
  }
  if (typeof raw === "object") return raw as Permissions;
  return null;
}

export class SequelizeRoleRepository implements RoleRepository {
  constructor(private models: Models) {}

  // Map row Sequelize -> Domain
  private mapRow = (r: any): Role =>
    Role.create({
      id: Number(r.id),
      title: r.title,
      description: r.description ?? null,
      permissions: parsePermissions(r.permissions),
      deleted: toBool(r.deleted),
      deletedAt: r.deleted_at ?? r.deletedAt ?? null,
      createdAt: r.created_at ?? r.createdAt,
      updatedAt: r.updated_at ?? r.updatedAt,
    });

  async list(filter: RoleListFilter & { q?: string }) {
    const { includeDeleted = false, q } = filter ?? {};
    const where: WhereOptions = {};

    if (!includeDeleted) (where as any).deleted = 0;
    if (q && q.trim()) {
      (where as any).title = { [Op.like]: `%${q.trim()}%` };
    }

    const { rows, count } = await this.models.Role.findAndCountAll({
      where,
      order: [["id", "DESC"]],
    });

    return { rows: rows.map(this.mapRow), count };
  }

  async findById(id: number, includeDeleted = false) {
    const where: WhereOptions = { id };
    if (!includeDeleted) (where as any).deleted = 0;

    const r = await this.models.Role.findOne({ where });
    return r ? this.mapRow(r) : null;
  }

  async create(input: CreateRoleInput) {
    const r = await this.models.Role.create({
      title: input.title,
      description: input.description ?? null,
      permissions: input.permissions ?? null, // nếu cột là TEXT, Sequelize vẫn stringify JSON object
      deleted: 0,
      deleted_at: null,
    });
    return this.mapRow(r);
  }

  async update(id: number, patch: UpdateRolePatch) {
    const values: any = {};
    if (patch.title !== undefined) values.title = patch.title;
    if (patch.description !== undefined) values.description = patch.description;
    if (patch.permissions !== undefined) values.permissions = patch.permissions ?? null;

    await this.models.Role.update(values, { where: { id } });

    const r = await this.models.Role.findByPk(id);
    if (!r) throw new Error("Role not found after update");
    return this.mapRow(r);
  }

  async softDelete(id: number) {
    const found = await this.models.Role.findByPk(id);
    if (!found) throw new Error("Role not found");

    await this.models.Role.update(
      { deleted: 1, deleted_at: new Date() },
      { where: { id } }
    );

    return { id: Number(id), title: String(found.title) };
  }

  async listForPermissions() {
    const rows = await this.models.Role.findAll({
      where: { deleted: 0 },
      attributes: ["id", "title", "permissions"],
      order: [["id", "ASC"]],
    });

    return rows.map((r: any) => ({
      id: Number(r.id),
      title: String(r.title),
      permissions: parsePermissions(r.permissions) ?? {},
    }));
  }

  async updatePermissions(roles: Array<{ id: number; permissions: Permissions }>) {
    // Có thể gói transaction nếu muốn đảm bảo tính toàn vẹn
    const sequelize = this.models.Role.sequelize as any;
    const t = await sequelize.transaction();
    try {
      for (const r of roles) {
        await this.models.Role.update(
          { permissions: r.permissions ?? {} },
          { where: { id: r.id }, transaction: t }
        );
      }
      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }
}
