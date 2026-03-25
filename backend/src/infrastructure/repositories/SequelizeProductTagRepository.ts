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
    productTagGroupId: Number(row.product_tag_group_id),
    group: row.group
      ? {
          id: Number(row.group.id),
          name: String(row.group.name),
          slug: row.group.slug ? String(row.group.slug) : null,
          deleted: !!row.group.deleted,
          deletedAt: row.group.deleted_at ?? null,
          createdAt: row.group.created_at ?? undefined,
          updatedAt: row.group.updated_at ?? undefined,
        }
      : null,
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
      const keyword = filter.q.trim();
      where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { slug: { [Op.like]: `%${keyword}%` } },
      ];
    }

    if (
      filter.productTagGroupId !== undefined &&
      filter.productTagGroupId !== null &&
      filter.productTagGroupId !== "all"
    ) {
      where.product_tag_group_id = Number(filter.productTagGroupId);
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
      include: [
        {
          association: "group",
          required: false,
        },
      ],
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
      include: [
        {
          association: "group",
          required: false,
        },
      ],
    });

    if (!row) return null;
    return mapRow(row);
  }

  async findActiveByIds(ids: number[]) {
    const normalizedIds = [...new Set(ids.map(Number))].filter(
      (id) => Number.isInteger(id) && id > 0,
    );

    if (normalizedIds.length === 0) return [];

    const rows = await this.ProductTagModel.findAll({
      where: {
        id: { [Op.in]: normalizedIds },
        deleted: 0,
      },
      include: [
        {
          association: "group",
          required: false,
        },
      ],
      order: [["id", "ASC"]],
    });

    return rows.map(mapRow);
  }

  async create(input: CreateProductTagInput) {
    const row = await this.ProductTagModel.create({
      name: input.name,
      slug: input.slug ?? null,
      product_tag_group_id: input.productTagGroupId,
      deleted: 0,
      deleted_at: null,
    });

    const created = await this.ProductTagModel.findOne({
      where: { id: row.id },
      include: [
        {
          association: "group",
          required: false,
        },
      ],
    });

    return mapRow(created || row);
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
    if (patch.productTagGroupId !== undefined) {
      nextPatch.product_tag_group_id = patch.productTagGroupId;
    }
    if (patch.deleted !== undefined) {
      nextPatch.deleted = patch.deleted ? 1 : 0;
      nextPatch.deleted_at = patch.deleted ? new Date() : null;
    }

    await existing.update(nextPatch);

    const updated = await this.ProductTagModel.findOne({
      where: { id },
      include: [
        {
          association: "group",
          required: false,
        },
      ],
    });

    return mapRow(updated || existing);
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

    const normalizedIds = [...new Set(ids.map(Number))].filter(
      (id) => Number.isInteger(id) && id > 0,
    );

    if (normalizedIds.length === 0) return 0;

    const [affectedCount] = await this.ProductTagModel.update(
      {
        deleted: 1,
        deleted_at: new Date(),
      },
      {
        where: {
          id: { [Op.in]: normalizedIds },
          deleted: 0,
        },
      },
    );

    return Number(affectedCount || 0);
  }
}
