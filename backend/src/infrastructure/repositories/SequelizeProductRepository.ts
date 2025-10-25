// src/infrastructure/repositories/SequelizeProductRepository.ts
import { Op, WhereOptions, literal } from "sequelize";
import { Product as DomainProduct } from "../../domain/products/Products";
import type {
  CreateProductInput,
  ProductRepository,
  UpdateProductPatch,
} from "../../domain/products/ProductRepository";
import type {
  ProductListFilter,
  ProductStatus,
} from "../../domain/products/types";

// Kiểu models được inject (đề phòng bạn gom models ở 1 chỗ)
type Models = {
  Product: any;
  ProductCategory?: any;
};

export class SequelizeProductRepository implements ProductRepository {
  constructor(private models: Models) {}

  // Map Sequelize Row -> Domain
  private mapRow = (r: any): DomainProduct => {
    return DomainProduct.create({
      id: Number(r.id),
      categoryId: r.product_category_id ?? null,
      category: r.category
        ? { id: Number(r.category.id), title: r.category.title }
        : null,
      title: r.title,
      description: r.description ?? null,
      price: r.price !== null && r.price !== undefined ? Number(r.price) : null,
      discountPercentage:
        r.discount_percentage !== null && r.discount_percentage !== undefined
          ? Number(r.discount_percentage)
          : null,
      stock: Number(r.stock ?? 0),
      thumbnail: r.thumbnail ?? null,
      slug: r.slug ?? null,
      status: r.status as ProductStatus,
      featured: !!r.featured,
      position: r.position ?? null,
      averageRating:
        r.average_rating !== null && r.average_rating !== undefined
          ? Number(r.average_rating)
          : 0,
      reviewCount: Number(r.review_count ?? 0),
      deleted: !!r.deleted,
      deletedAt: r.deleted_at ?? null,
      createdAt: r.created_at ?? r.createdAt,
      updatedAt: r.updated_at ?? r.updatedAt,
      createdById: r.created_by_id ?? null,
      updatedById: r.updated_by_id ?? null,
    });
  };

  async list(filter: ProductListFilter) {
    const {
      page = 1,
      limit = 10,
      q,
      categoryId = null,
      status = "all",
      featured,
      minPrice,
      maxPrice,
      sortBy = "id",
      order = "DESC",
    } = filter;

    const where: WhereOptions = { deleted: 0 };

    if (categoryId !== null) {
      (where as any).product_category_id = categoryId;
    }
    if (status !== "all") {
      (where as any).status = status;
    }
    if (typeof featured === "boolean") {
      (where as any).featured = featured ? 1 : 0;
    }
    if (q) {
      (where as any)[Op.or] = [
        { title: { [Op.like]: `%${q}%` } },
        { slug: { [Op.like]: `%${q}%` } },
      ];
    }
    if (minPrice != null || maxPrice != null) {
      (where as any).price = {};
      if (minPrice != null) (where as any).price[Op.gte] = minPrice;
      if (maxPrice != null) (where as any).price[Op.lte] = maxPrice;
    }

    // Map sortBy (domain) -> column DB
    const sortColMap: Record<string, string> = {
      id: "id",
      title: "title",
      price: "price",
      stock: "stock",
      position: "position",
      average_rating: "average_rating",
      review_count: "review_count",
      createdAt: "created_at",
      updatedAt: "updated_at",
      slug: "slug",
    };
    const col = sortColMap[sortBy] || "id";
    const orderBy: any[] = [[literal(col), order]];

    const offset = (page - 1) * limit;

    const { rows, count } = await this.models.Product.findAndCountAll({
      where,
      limit,
      offset,
      order: orderBy,
      // include category nếu bạn đã set association
      include: this.models.ProductCategory
        ? [
            {
              model: this.models.ProductCategory,
              as: "category",
              attributes: ["id", "title"],
            },
          ]
        : undefined,
    });

    return { rows: rows.map(this.mapRow), count };
  }

  async findById(id: number) {
    const r = await this.models.Product.findOne({
      where: { id, deleted: 0 },
      include: this.models.ProductCategory
        ? [
            {
              model: this.models.ProductCategory,
              as: "category",
              attributes: ["id", "title"],
            },
          ]
        : undefined,
    });
    return r ? this.mapRow(r) : null;
  }

  async create(input: CreateProductInput) {
    // ✅ Nếu position không truyền → tính tự động
    let position = input.position ?? null;

    if (position == null) {
      const where: any = {
        product_category_id: input.categoryId ?? null,
        deleted: 0,
      };

      // Lấy vị trí cao nhất hiện có trong cùng category
      const maxPos: number =
        (await this.models.Product.max("position", { where })) || 0;
      position = maxPos + 1;
    }

    const r = await this.models.Product.create({
      product_category_id: input.categoryId ?? null,
      title: input.title,
      description: input.description ?? null,
      price: input.price ?? null,
      discount_percentage: input.discountPercentage ?? null,
      stock: input.stock ?? 0,
      thumbnail: input.thumbnail ?? null,
      slug: input.slug ?? null, // có thể tự sinh bằng hook nếu null
      status: input.status ?? "active",
      featured: !!input.featured,
      position,
      deleted: 0,
      deleted_at: null,
    });

    // Trả về entity domain
    return this.mapRow(r);
  }

  async update(id: number, patch: UpdateProductPatch) {
    const updateData: any = { ...patch };
    // Nếu có categoryId thì map sang product_category_id
    if (patch.categoryId !== undefined) {
      updateData.product_category_id = patch.categoryId;
      delete updateData.categoryId;
    }
    await this.models.Product.update(updateData, { where: { id } });
    const r = await this.models.Product.findByPk(id);
    if (!r) throw new Error("Product not found after update");
    return this.mapRow(r);
  }

  async changeStatus(id: number, status: ProductStatus) {
    await this.models.Product.update({ status }, { where: { id } });
  }

  async softDelete(id: number) {
    await this.models.Product.update(
      { deleted: 1, deleted_at: new Date() },
      { where: { id } }
    );
  }

  async bulkEdit(ids: number[], patch: UpdateProductPatch) {
    const values: any = {};
    if (patch.categoryId !== undefined)
      values.product_category_id = patch.categoryId;
    if (patch.title !== undefined) values.title = patch.title;
    if (patch.description !== undefined) values.description = patch.description;
    if (patch.price !== undefined) values.price = patch.price;
    if (patch.discountPercentage !== undefined)
      values.discount_percentage = patch.discountPercentage;
    if (patch.stock !== undefined) values.stock = patch.stock;
    if (patch.thumbnail !== undefined) values.thumbnail = patch.thumbnail;
    if (patch.slug !== undefined) values.slug = patch.slug;
    if (patch.status !== undefined) values.status = patch.status;
    if (patch.featured !== undefined) values.featured = patch.featured ? 1 : 0;
    if (patch.position !== undefined) values.position = patch.position;
    if (patch.deleted !== undefined) values.deleted = patch.deleted ? 1 : 0;
    if (patch.deleted === true) values.deleted_at = new Date();
    if (patch.deleted === false) values.deleted_at = null;
    if (patch.updatedById !== undefined)
      values.updated_by_id = patch.updatedById;

    const [affected] = await this.models.Product.update(values, {
      where: { id: { [Op.in]: ids } },
    });
    return affected ?? 0;
  }

  async reorderPositions(
    pairs: { id: number; position: number }[],
    updatedById?: number
  ) {
    const ids = pairs.map((p) => Number(p.id));
    // CASE WHEN nhanh & 1 câu UPDATE
    const whenClauses = pairs
      .map((p) => `WHEN ${Number(p.id)} THEN ${Number(p.position)}`)
      .join(" ");
    const setUpdated =
      typeof updatedById === "number" ? ", updated_by_id = :updatedById" : "";
    const sql = `
    UPDATE products
    SET position = CASE id ${whenClauses} END
    ${setUpdated}
    WHERE id IN (:ids)
  `;

    // Lấy sequelize từ model
    const sequelize = this.models.Product.sequelize as any;

    const [result] = await sequelize.query(sql, {
      replacements: { ids, updatedById },
    });

    // MySQL trả affectedRows tuỳ driver; fallback count từ ids
    const affected = result?.affectedRows ?? result ?? ids.length;
    return Number(affected);
  }
}
