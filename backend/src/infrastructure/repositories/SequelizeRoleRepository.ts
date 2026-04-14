// src/infrastructure/repositories/SequelizeRoleRepository.ts
import { Op, WhereOptions } from "sequelize";
import { Role } from "../../domain/roles/Role";
import type {
  RoleRepository,
  CreateRoleInput,
  UpdateRolePatch,
} from "../../domain/roles/RoleRepository";
import type {
  RoleListFilter,
  Permissions,
  RoleScope,
} from "../../domain/roles/types";

type Models = { Role: any };

function toBool(v: any): boolean {
  return v === true || v === 1 || v === "1";
}

function parseScope(raw: any): RoleScope {
  const value = String(raw ?? "")
    .trim()
    .toLowerCase();

  if (value === "system" || value === "branch" || value === "client") {
    return value;
  }

  return "branch";
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
      code: String(r.code ?? "")
        .trim()
        .toLowerCase(),
      scope: parseScope(r.scope),
      level: Number(r.level ?? 0),
      isAssignable: toBool(r.is_assignable ?? r.isAssignable),
      isProtected: toBool(r.is_protected ?? r.isProtected),
      title: r.title,
      description: r.description ?? null,
      permissions: parsePermissions(r.permissions),
      deleted: toBool(r.deleted),
      deletedAt: r.deleted_at ?? r.deletedAt ?? null,
      createdAt: r.created_at ?? r.createdAt,
      updatedAt: r.updated_at ?? r.updatedAt,
    });

  async list(filter: RoleListFilter & { q?: string }) {
    const {
      includeDeleted = false,
      q,
      scope,
      assignableOnly = false,
    } = filter ?? {};

    const where: WhereOptions = {};

    if (!includeDeleted) {
      (where as any).deleted = 0;
    }

    if (q && q.trim()) {
      (where as any)[Op.or] = [
        { title: { [Op.like]: `%${q.trim()}%` } },
        { code: { [Op.like]: `%${q.trim().toLowerCase()}%` } },
      ];
    }

    if (scope) {
      (where as any).scope = scope;
    }

    if (assignableOnly) {
      (where as any).is_assignable = 1;
    }

    const { rows, count } = await this.models.Role.findAndCountAll({
      where,
      order: [
        ["level", "DESC"],
        ["id", "ASC"],
      ],
    });

    return { rows: rows.map(this.mapRow), count };
  }

  async findById(id: number, includeDeleted = false) {
    const where: WhereOptions = { id };
    if (!includeDeleted) (where as any).deleted = 0;

    const r = await this.models.Role.findOne({ where });
    return r ? this.mapRow(r) : null;
  }

  async findByCode(code: string, includeDeleted = false) {
    const where: WhereOptions = { code: String(code).trim().toLowerCase() };
    if (!includeDeleted) {
      (where as any).deleted = 0;
    }

    const r = await this.models.Role.findOne({ where });
    return r ? this.mapRow(r) : null;
  }

  async listAssignable(filter: {
    actorRoleCode?: string | null;
    actorLevel?: number | null;
    actorIsSuperAdmin?: boolean;
  }) {
    const where: WhereOptions = {
      deleted: 0,
      is_assignable: 1,
    };

    if (filter.actorIsSuperAdmin) {
      const rows = await this.models.Role.findAll({
        where,
        order: [
          ["level", "DESC"],
          ["id", "ASC"],
        ],
      });
      return rows.map(this.mapRow);
    }

    const actorLevel =
      filter.actorLevel === null || filter.actorLevel === undefined
        ? null
        : Number(filter.actorLevel);

    if (actorLevel === null || !Number.isFinite(actorLevel)) {
      return [];
    }

    (where as any).scope = "branch";
    (where as any).level = { [Op.lt]: actorLevel };

    const rows = await this.models.Role.findAll({
      where,
      order: [
        ["level", "DESC"],
        ["id", "ASC"],
      ],
    });

    return rows.map(this.mapRow);
  }

  async create(input: CreateRoleInput) {
    const r = await this.models.Role.create({
      code: input.code.trim().toLowerCase(),
      scope: input.scope,
      level: input.level,
      is_assignable: input.isAssignable ? 1 : 0,
      is_protected: input.isProtected ? 1 : 0,
      title: input.title,
      description: input.description ?? null,
      permissions: input.permissions ?? null,
      deleted: 0,
      deleted_at: null,
    });

    return this.mapRow(r);
  }

  async update(id: number, patch: UpdateRolePatch) {
    const values: any = {};

    if (patch.code !== undefined) {
      values.code = patch.code.trim().toLowerCase();
    }
    if (patch.scope !== undefined) {
      values.scope = patch.scope;
    }
    if (patch.level !== undefined) {
      values.level = patch.level;
    }
    if (patch.isAssignable !== undefined) {
      values.is_assignable = patch.isAssignable ? 1 : 0;
    }
    if (patch.isProtected !== undefined) {
      values.is_protected = patch.isProtected ? 1 : 0;
    }
    if (patch.title !== undefined) {
      values.title = patch.title;
    }
    if (patch.description !== undefined) {
      values.description = patch.description;
    }
    if (patch.permissions !== undefined) {
      values.permissions = patch.permissions ?? null;
    }

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
      { where: { id } },
    );

    return { id: Number(id), title: String(found.title) };
  }

  async listForPermissions() {
    const rows = await this.models.Role.findAll({
      where: { deleted: 0 },
      attributes: [
        "id",
        "code",
        "scope",
        "level",
        "is_assignable",
        "is_protected",
        "title",
        "permissions",
      ],
      order: [["id", "ASC"]],
    });

    return rows.map((r: any) => ({
      id: Number(r.id),
      title: String(r.title),
      code: String(r.code ?? "")
        .trim()
        .toLowerCase(),
      scope: parseScope(r.scope),
      level: Number(r.level ?? 0),
      isAssignable: toBool(r.is_assignable ?? r.isAssignable),
      isProtected: toBool(r.is_protected ?? r.isProtected),
      permissions: parsePermissions(r.permissions) ?? {},
    }));
  }

  async updatePermissions(
    roles: Array<{ id: number; permissions: Permissions }>,
  ) {
    // Có thể gói transaction nếu muốn đảm bảo tính toàn vẹn
    const sequelize = this.models.Role.sequelize as any;
    const t = await sequelize.transaction();
    try {
      for (const r of roles) {
        await this.models.Role.update(
          { permissions: r.permissions ?? {} },
          { where: { id: r.id }, transaction: t },
        );
      }
      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }
}
