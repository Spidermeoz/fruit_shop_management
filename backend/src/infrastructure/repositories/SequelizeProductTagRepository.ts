import { Op } from "sequelize";
import type {
  CreateProductTagInput,
  ProductTag,
  ProductTagListFilter,
  ProductTagRepository,
  UpdateProductTagPatch,
} from "../../domain/products/ProductTagRepository";

type ProductTagModelStatic = any;

function mapRow(row: any): ProductTag {
  return {
    id: Number(row.id),
    name: String(row.name),
    slug: row.slug ? String(row.slug) : null,
    description: row.description ?? null,
    tagGroup: row.tag_group,
    deleted: !!row.deleted,
    deletedAt: row.deleted_at ?? null,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}

export class SequelizeProductTagRepository implements ProductTagRepository {
  constructor(private readonly ProductTagModel: ProductTagModelStatic) {}

  async list(filter: ProductTagListFilter) {
    const page = Math.max(1, Number(filter.page || 1));
    const limit = Math.max(1, Math.min(1000, Number(filter.limit || 20)));
    const offset = (page - 1) * limit;

    const where: any = {
      deleted: 0,
    };

    if (filter.q?.trim()) {
      where[Op.or] = [
        { name: { [Op.like]: `%${filter.q.trim()}%` } },
        { slug: { [Op.like]: `%${filter.q.trim()}%` } },
        { description: { [Op.like]: `%${filter.q.trim()}%` } },
      ];
    }

    if (filter.tagGroup && filter.tagGroup !== "all") {
      where.tag_group = filter.tagGroup;
    }

    const sortableFields: Record<string, string> = {
      id: "id",
      name: "name",
      createdAt: "created_at",
      updatedAt: "updated_at",
    };

    const sortBy = sortableFields[filter.sortBy || "name"] || "name";
    const order = filter.order === "DESC" ? "DESC" : "ASC";

    const { rows, count } = await this.ProductTagModel.findAndCountAll({
      where,
      offset,
      limit,
      order: [[sortBy, order]],
    });

    return {
      rows: rows.map(mapRow),
      count: Number(count || 0),
    };
  }

  async findById(id: number) {
    const row = await this.ProductTagModel.findOne({
      where: { id, deleted: 0 },
    });

    if (!row) return null;
    return mapRow(row);
  }

  async create(input: CreateProductTagInput) {
    const row = await this.ProductTagModel.create({
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      tag_group: input.tagGroup,
      deleted: 0,
    });

    return mapRow(row);
  }

  async update(id: number, patch: UpdateProductTagPatch) {
    const existing = await this.ProductTagModel.findOne({
      where: { id, deleted: 0 },
    });

    if (!existing) {
      throw new Error("Không tìm thấy product tag");
    }

    const nextPatch: any = {};

    if (patch.name !== undefined) nextPatch.name = patch.name;
    if (patch.slug !== undefined) nextPatch.slug = patch.slug;
    if (patch.description !== undefined)
      nextPatch.description = patch.description;
    if (patch.tagGroup !== undefined) nextPatch.tag_group = patch.tagGroup;

    await existing.update(nextPatch);

    return mapRow(existing);
  }

  async softDelete(id: number) {
    const existing = await this.ProductTagModel.findOne({
      where: { id, deleted: 0 },
    });

    if (!existing) {
      throw new Error("Không tìm thấy product tag");
    }

    await existing.update({
      deleted: 1,
      deleted_at: new Date(),
    });
  }

  async bulkSoftDelete(ids: number[]) {
    if (!Array.isArray(ids) || ids.length === 0) return 0;

    const [affectedCount] = await this.ProductTagModel.update(
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

    return Number(affectedCount || 0);
  }
}
