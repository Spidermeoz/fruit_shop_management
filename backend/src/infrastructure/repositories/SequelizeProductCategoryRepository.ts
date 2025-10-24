// src/infrastructure/repositories/SequelizeProductCategoryRepository.ts
import { Op, WhereOptions, literal } from "sequelize";
import { ProductCategory as DomainCategory } from "../../domain/categories/ProductCategory";
import type {
  ProductCategoryRepository,
  CreateCategoryInput,
  UpdateCategoryPatch,
} from "../../domain/categories/ProductCategoryRepository";
import type { CategoryListFilter, CategoryStatus } from "../../domain/categories/types";

type Models = { ProductCategory: any };

export class SequelizeProductCategoryRepository implements ProductCategoryRepository {
  constructor(private models: Models) {}

  // Map Sequelize Row -> Domain
  private mapRow = (r: any): DomainCategory =>
    DomainCategory.create({
      id: Number(r.id),
      title: r.title,
      parentId: r.parent_id ?? null,
      description: r.description ?? null,
      thumbnail: r.thumbnail ?? null,
      status: r.status as CategoryStatus,
      position: r.position ?? null,
      slug: r.slug ?? null,
      deleted: !!r.deleted,
      deletedAt: r.deleted_at ?? null,
      createdAt: r.created_at ?? r.createdAt,
      updatedAt: r.updated_at ?? r.updatedAt,
    });

  async list(filter: CategoryListFilter) {
    const {
      page = 1,
      limit = 20,
      q,
      parentId,
      status = "all",
      includeDeleted = false,
      sortBy = "position",
      order = "ASC",
      tree = false, // hiện trả flat list; có thể nâng cấp build cây nếu cần
    } = filter;

    const where: WhereOptions = {};
    if (!includeDeleted) (where as any).deleted = 0;
    if (status !== "all") (where as any).status = status;
    if (parentId !== undefined) (where as any).parent_id = parentId;
    if (q) {
      (where as any)[Op.or] = [
        { title: { [Op.like]: `%${q}%` } },
        { slug: { [Op.like]: `%${q}%` } },
      ];
    }

    const sortMap: Record<string, string> = {
      id: "id",
      title: "title",
      status: "status",
      position: "position",
      createdAt: "created_at",
      updatedAt: "updated_at",
    };
    const col = sortMap[sortBy] || "position";
    const orderBy: any = [[literal(col), order]];

    const offset = (page - 1) * limit;
    const { rows, count } = await this.models.ProductCategory.findAndCountAll({
      where,
      offset,
      limit,
      order: orderBy,
    });

    return { rows: rows.map(this.mapRow), count };
  }

  async findById(id: number) {
    const r = await this.models.ProductCategory.findOne({ where: { id } });
    return r ? this.mapRow(r) : null;
  }

  async findByIdWithParent(id: number) {
    const r = await this.models.ProductCategory.findOne({ where: { id } });
    if (!r) return null;
    const parent =
      r.parent_id != null
        ? await this.models.ProductCategory.findOne({ where: { id: r.parent_id } })
        : null;
    return { category: this.mapRow(r), parent: parent ? this.mapRow(parent) : null };
  }

  async create(input: CreateCategoryInput) {
    // Tự động tính position nếu để null: cuối danh sách trong cùng parent
    let position = input.position ?? null;
    if (position == null) {
      const where: any = { parent_id: input.parentId ?? null, deleted: 0 };
      const maxPos: number = (await this.models.ProductCategory.max("position", { where })) || 0;
      position = maxPos + 1;
    }

    const r = await this.models.ProductCategory.create({
      title: input.title,
      parent_id: input.parentId ?? null,
      description: input.description ?? null,
      thumbnail: input.thumbnail ?? null,
      status: input.status ?? "active",
      position,
      slug: input.slug ?? null, // hook sẽ tự đảm bảo unique nếu null
      deleted: 0,
      deleted_at: null,
    });

    return this.mapRow(r);
  }

  async update(id: number, patch: UpdateCategoryPatch) {
    const values: any = {};
    if (patch.title !== undefined) values.title = patch.title;
    if (patch.parentId !== undefined) values.parent_id = patch.parentId;
    if (patch.description !== undefined) values.description = patch.description;
    if (patch.thumbnail !== undefined) values.thumbnail = patch.thumbnail;
    if (patch.status !== undefined) values.status = patch.status;
    if (patch.slug !== undefined) values.slug = patch.slug;

    // position: nếu null → tự động đẩy xuống cuối nhóm sibling hiện tại
    if (patch.position !== undefined) {
      values.position = patch.position;
      if (patch.position === null) {
        const where: any = { parent_id: patch.parentId ?? undefined, deleted: 0 };
        if (where.parent_id === undefined) delete where.parent_id;

        const maxPos: number =
          (await this.models.ProductCategory.max("position", { where })) || 0;
        values.position = maxPos + 1;
      }
    }

    if (patch.deleted !== undefined) values.deleted = patch.deleted ? 1 : 0;
    if (patch.deleted === true) values.deleted_at = new Date();
    if (patch.deleted === false) values.deleted_at = null;

    await this.models.ProductCategory.update(values, { where: { id } });

    // Nếu bị xoá mềm và có con → detach con
    if (patch.deleted === true) {
      await this.detachChildrenOf([id]);
    }

    const r = await this.models.ProductCategory.findByPk(id);
    if (!r) throw new Error("Category not found after update");
    return this.mapRow(r);
  }

  async changeStatus(id: number, status: CategoryStatus) {
    await this.models.ProductCategory.update({ status }, { where: { id } });
  }

  async softDelete(id: number) {
    await this.models.ProductCategory.update(
      { deleted: 1, deleted_at: new Date() },
      { where: { id } }
    );
    // Tách con của danh mục này
    await this.detachChildrenOf([id]);
  }

  async bulkEdit(ids: number[], patch: UpdateCategoryPatch) {
    const values: any = {};
    if (patch.title !== undefined) values.title = patch.title;
    if (patch.parentId !== undefined) values.parent_id = patch.parentId;
    if (patch.description !== undefined) values.description = patch.description;
    if (patch.thumbnail !== undefined) values.thumbnail = patch.thumbnail;
    if (patch.status !== undefined) values.status = patch.status;
    if (patch.slug !== undefined) values.slug = patch.slug;

    if (patch.deleted !== undefined) values.deleted = patch.deleted ? 1 : 0;
    if (patch.deleted === true) values.deleted_at = new Date();
    if (patch.deleted === false) values.deleted_at = null;

    const [affected] = await this.models.ProductCategory.update(values, {
      where: { id: { [Op.in]: ids } },
    });

    // Nếu bulk xoá → detach tất cả con
    if (patch.deleted === true) {
      await this.detachChildrenOf(ids);
    }

    return affected ?? 0;
  }

  async reorderPositions(pairs: { id: number; position: number }[]) {
    const ids = pairs.map((p) => Number(p.id));
    const whenClauses = pairs
      .map((p) => `WHEN ${Number(p.id)} THEN ${Number(p.position)}`)
      .join(" ");
    const sql = `
      UPDATE products_category
      SET position = CASE id ${whenClauses} END,
          updated_at = :now
      WHERE id IN (:ids)
    `;
    const sequelize = this.models.ProductCategory.sequelize as any;
    const now = new Date();

    const [result] = await sequelize.query(sql, {
      replacements: { ids, now },
    });

    const affected = (result?.affectedRows ?? result) ?? ids.length;
    return Number(affected);
  }

  async detachChildrenOf(parentIds: number[]) {
    const [affected] = await this.models.ProductCategory.update(
      { parent_id: null },
      { where: { parent_id: { [Op.in]: parentIds } } }
    );
    return affected ?? 0;
  }
}
