import { Op } from "sequelize";
import type {
  CreateProductTagGroupInput,
  ProductTagGroup,
  ProductTagGroupListFilter,
  ProductTagGroupRepository,
  UpdateProductTagGroupPatch,
} from "../../domain/products/ProductTagGroupRepository";

type ModelStatic = any;

function mapTagRow(row: any) {
  return {
    id: Number(row.id),
    name: String(row.name),
    slug: row.slug ? String(row.slug) : null,
    productTagGroupId: Number(row.product_tag_group_id),
    deleted: !!row.deleted,
    deletedAt: row.deleted_at ?? null,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}

function mapGroupRow(row: any): ProductTagGroup {
  return {
    id: Number(row.id),
    name: String(row.name),
    slug: row.slug ? String(row.slug) : null,
    deleted: !!row.deleted,
    deletedAt: row.deleted_at ?? null,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
    tags: Array.isArray(row.tags) ? row.tags.map(mapTagRow) : undefined,
  };
}

export class SequelizeProductTagGroupRepository implements ProductTagGroupRepository {
  constructor(
    private readonly ProductTagGroupModel: ModelStatic,
    private readonly ProductTagModel: ModelStatic,
  ) {}

  async list(filter: ProductTagGroupListFilter) {
    const page = Math.max(1, Number(filter.page || 1));
    const limit = Math.max(1, Math.min(1000, Number(filter.limit || 20)));
    const offset = (page - 1) * limit;

    const where: any = { deleted: 0 };

    if (filter.q?.trim()) {
      const keyword = filter.q.trim();
      where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { slug: { [Op.like]: `%${keyword}%` } },
      ];
    }

    const sortableFields: Record<string, string> = {
      id: "id",
      name: "name",
      createdAt: "created_at",
      updatedAt: "updated_at",
    };

    const sortBy = sortableFields[filter.sortBy || "name"] || "name";
    const order = filter.order === "DESC" ? "DESC" : "ASC";

    const include = filter.includeTags
      ? [
          {
            association: "tags",
            required: false,
            where: { deleted: 0 },
          },
        ]
      : [];

    const { rows, count } = await this.ProductTagGroupModel.findAndCountAll({
      where,
      include,
      distinct: true,
      offset,
      limit,
      order: [[sortBy, order]],
    });

    return {
      rows: rows.map(mapGroupRow),
      count: Number(count || 0),
    };
  }

  async findById(id: number, options?: { includeTags?: boolean }) {
    const include = options?.includeTags
      ? [
          {
            association: "tags",
            required: false,
            where: { deleted: 0 },
          },
        ]
      : [];

    const row = await this.ProductTagGroupModel.findOne({
      where: { id, deleted: 0 },
      include,
    });

    if (!row) return null;
    return mapGroupRow(row);
  }

  async create(input: CreateProductTagGroupInput) {
    const row = await this.ProductTagGroupModel.create({
      name: input.name,
      slug: input.slug ?? null,
      deleted: 0,
      deleted_at: null,
    });

    return mapGroupRow(row);
  }

  async update(id: number, patch: UpdateProductTagGroupPatch) {
    const existing = await this.ProductTagGroupModel.findOne({
      where: { id, deleted: 0 },
    });

    if (!existing) {
      throw new Error("Không tìm thấy product tag group");
    }

    const nextPatch: any = {};

    if (patch.name !== undefined) nextPatch.name = patch.name;
    if (patch.slug !== undefined) nextPatch.slug = patch.slug;
    if (patch.deleted !== undefined) {
      nextPatch.deleted = patch.deleted ? 1 : 0;
      nextPatch.deleted_at = patch.deleted ? new Date() : null;
    }

    await existing.update(nextPatch);

    const updated = await this.ProductTagGroupModel.findOne({
      where: { id },
      include: [
        {
          association: "tags",
          required: false,
          where: { deleted: 0 },
        },
      ],
    });

    return mapGroupRow(updated || existing);
  }

  async softDelete(id: number) {
    const existing = await this.ProductTagGroupModel.findOne({
      where: { id, deleted: 0 },
      include: [
        {
          association: "tags",
          required: false,
          where: { deleted: 0 },
        },
      ],
    });

    if (!existing) {
      throw new Error("Không tìm thấy product tag group");
    }

    const activeTags = Array.isArray((existing as any).tags)
      ? (existing as any).tags
      : [];

    if (activeTags.length > 0) {
      throw new Error("Không thể xóa group đang còn product tag");
    }

    await existing.update({
      deleted: 1,
      deleted_at: new Date(),
    });
  }
}
