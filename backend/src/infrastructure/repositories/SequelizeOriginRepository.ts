import { Op, literal, type WhereOptions } from "sequelize";
import type {
  CreateOriginInput,
  Origin,
  OriginListFilter,
  OriginRepository,
  OriginStatus,
  UpdateOriginPatch,
} from "../../domain/products/OriginRepository";

export class SequelizeOriginRepository implements OriginRepository {
  constructor(private OriginModel: any) {}

  private toPlain(row: any) {
    if (!row) return row;
    return typeof row.get === "function" ? row.get({ plain: true }) : row;
  }

  private mapRow = (row: any): Origin => {
    const r = this.toPlain(row);

    return {
      id: Number(r.id),
      name: r.name,
      slug: r.slug ?? null,
      description: r.description ?? null,
      countryCode: r.country_code ?? null,
      status: r.status as OriginStatus,
      position:
        r.position !== undefined && r.position !== null
          ? Number(r.position)
          : null,
      deleted: !!r.deleted,
      deletedAt: r.deleted_at ?? null,
      createdAt: r.created_at ?? r.createdAt,
      updatedAt: r.updated_at ?? r.updatedAt,
    };
  };

  private async resolvePosition(position?: number | null) {
    if (position != null) return Number(position);

    let maxPos = await this.OriginModel.max("position", {
      where: { deleted: 0 },
    });

    maxPos = Number(maxPos) || 0;

    return maxPos + 1;
  }

  async list(filter: OriginListFilter) {
    const {
      page = 1,
      limit = 20,
      q,
      status = "all",
      sortBy = "position",
      order = "ASC",
    } = filter;

    const where: WhereOptions = { deleted: 0 };

    if (status !== "all") {
      (where as any).status = status;
    }

    if (q) {
      (where as any)[Op.or] = [
        { name: { [Op.like]: `%${q}%` } },
        { slug: { [Op.like]: `%${q}%` } },
        { description: { [Op.like]: `%${q}%` } },
      ];
    }

    const sortColMap: Record<string, string> = {
      id: "id",
      name: "name",
      position: "position",
      createdAt: "created_at",
      updatedAt: "updated_at",
    };

    const col = sortColMap[sortBy] || "position";
    const offset = (page - 1) * limit;

    const { rows, count } = await this.OriginModel.findAndCountAll({
      where,
      limit,
      offset,
      order: [[literal(col), order]],
    });

    return {
      rows: rows.map(this.mapRow),
      count,
    };
  }

  async findById(id: number) {
    const row = await this.OriginModel.findOne({
      where: { id, deleted: 0 },
    });

    return row ? this.mapRow(row) : null;
  }

  async create(input: CreateOriginInput) {
    const position = await this.resolvePosition(input.position);

    const row = await this.OriginModel.create({
      name: input.name,
      slug: input.slug ?? null,
      description: input.description ?? null,
      country_code: input.countryCode ?? null,
      status: input.status ?? "active",
      position,
      deleted: 0,
      deleted_at: null,
    });

    return this.mapRow(row);
  }

  async update(id: number, patch: UpdateOriginPatch) {
    const existing = await this.findById(id);

    if (!existing) {
      throw new Error("Origin not found");
    }

    const values: any = {};

    if (patch.name !== undefined) values.name = patch.name;
    if (patch.slug !== undefined) values.slug = patch.slug;
    if (patch.description !== undefined) values.description = patch.description;
    if (patch.countryCode !== undefined) {
      values.country_code = patch.countryCode;
    }
    if (patch.status !== undefined) values.status = patch.status;
    if (patch.position !== undefined) values.position = patch.position;
    if (patch.deleted !== undefined) values.deleted = patch.deleted ? 1 : 0;
    if (patch.deleted === true) values.deleted_at = new Date();
    if (patch.deleted === false) values.deleted_at = null;

    await this.OriginModel.update(values, { where: { id } });

    const fresh = await this.findById(id);
    if (!fresh) throw new Error("Origin not found after update");

    return fresh;
  }

  async changeStatus(id: number, status: OriginStatus) {
    await this.OriginModel.update({ status }, { where: { id } });
  }

  async softDelete(id: number) {
    const existing = await this.findById(id);

    if (!existing) {
      throw new Error("Origin not found");
    }

    await this.OriginModel.update(
      {
        deleted: 1,
        deleted_at: new Date(),
      },
      { where: { id } },
    );
  }

  async bulkSoftDelete(ids: number[]) {
    if (!Array.isArray(ids) || ids.length === 0) return 0;

    const [affectedCount] = await this.OriginModel.update(
      {
        deleted: 1,
        deleted_at: new Date(),
      },
      {
        where: {
          id: { [Op.in]: ids },
          deleted: 0,
        },
      },
    );

    return Number(affectedCount) || 0;
  }
}
