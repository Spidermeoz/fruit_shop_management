import { Op, literal, type WhereOptions } from "sequelize";
import type {
  CreateProductTagInput,
  ProductTag,
  ProductTagListFilter,
  ProductTagRepository,
  ProductTagStatus,
  UpdateProductTagPatch,
} from "../../domain/products/ProductTagRepository";

export class SequelizeProductTagRepository implements ProductTagRepository {
  constructor(private ProductTagModel: any) {}

  private toPlain(row: any) {
    if (!row) return row;
    return typeof row.get === "function" ? row.get({ plain: true }) : row;
  }

  private mapRow = (row: any): ProductTag => {
    const r = this.toPlain(row);

    return {
      id: Number(r.id),
      name: r.name,
      slug: r.slug ?? null,
      tagGroup: r.tag_group,
      description: r.description ?? null,
      status: r.status,
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

    let maxPos = await this.ProductTagModel.max("position", {
      where: { deleted: 0 },
    });

    maxPos = Number(maxPos) || 0;

    return maxPos + 1;
  }

  async list(filter: ProductTagListFilter) {
    const {
      page = 1,
      limit = 20,
      q,
      status = "all",
      tagGroup = "all",
      sortBy = "position",
      order = "ASC",
    } = filter;

    const where: WhereOptions = { deleted: 0 };

    if (status !== "all") (where as any).status = status;
    if (tagGroup !== "all") (where as any).tag_group = tagGroup;

    if (q) {
      (where as any)[Op.or] = [
        { name: { [Op.like]: `%${q}%` } },
        { slug: { [Op.like]: `%${q}%` } },
      ];
    }

    const offset = (page - 1) * limit;

    const { rows, count } = await this.ProductTagModel.findAndCountAll({
      where,
      limit,
      offset,
      order: [[literal(sortBy), order]],
    });

    return {
      rows: rows.map(this.mapRow),
      count,
    };
  }

  async findById(id: number) {
    const row = await this.ProductTagModel.findOne({
      where: { id, deleted: 0 },
    });

    return row ? this.mapRow(row) : null;
  }

  async create(input: CreateProductTagInput) {
    const position = await this.resolvePosition(input.position);

    const row = await this.ProductTagModel.create({
      name: input.name,
      slug: input.slug ?? null,
      tag_group: input.tagGroup,
      description: input.description ?? null,
      status: input.status ?? "active",
      position,
      deleted: 0,
      deleted_at: null,
    });

    return this.mapRow(row);
  }

  async update(id: number, patch: UpdateProductTagPatch) {
    const values: any = {};

    if (patch.name !== undefined) values.name = patch.name;
    if (patch.slug !== undefined) values.slug = patch.slug;
    if (patch.tagGroup !== undefined) values.tag_group = patch.tagGroup;
    if (patch.description !== undefined) values.description = patch.description;
    if (patch.status !== undefined) values.status = patch.status;
    if (patch.position !== undefined) values.position = patch.position;

    await this.ProductTagModel.update(values, { where: { id } });

    const fresh = await this.findById(id);
    if (!fresh) throw new Error("Product tag not found");

    return fresh;
  }

  async changeStatus(id: number, status: ProductTagStatus) {
    await this.ProductTagModel.update({ status }, { where: { id } });
  }
}
