// backend/src/infrastructure/repositories/SequelizePostRepository.ts

import { Op, literal } from "sequelize";
import { Post } from "../../domain/posts/Post";
import type {
  CreatePostInput,
  PostRepository,
  UpdatePostPatch,
} from "../../domain/posts/PostRepository";
import type { PostListFilter, PostStatus } from "../../domain/posts/types";

type Models = {
  Post: any;
  PostCategory?: any;
  PostTag?: any;
  PostTagMap?: any;
  PostRelatedProduct?: any;
  Product?: any;
};

export class SequelizePostRepository implements PostRepository {
  constructor(private models: Models) {}

  private toPlain(row: any) {
    if (!row) return row;
    return typeof row.get === "function" ? row.get({ plain: true }) : row;
  }

  private mapRow = (row: any): Post => {
    const r = this.toPlain(row);

    return Post.create({
      id: Number(r.id),
      postCategoryId:
        r.post_category_id !== undefined && r.post_category_id !== null
          ? Number(r.post_category_id)
          : null,

      title: String(r.title ?? ""),
      slug: r.slug ?? null,
      excerpt: r.excerpt ?? null,
      content: r.content ?? null,
      thumbnail: r.thumbnail ?? null,

      status: (r.status ?? "draft") as PostStatus,
      featured: !!r.featured,
      position:
        r.position !== undefined && r.position !== null
          ? Number(r.position)
          : null,
      publishedAt: r.published_at ?? null,

      seoTitle: r.seo_title ?? null,
      seoDescription: r.seo_description ?? null,
      seoKeywords: r.seo_keywords ?? null,
      ogImage: r.og_image ?? null,
      canonicalUrl: r.canonical_url ?? null,

      viewCount: Number(r.view_count ?? 0),

      createdById:
        r.created_by_id !== undefined && r.created_by_id !== null
          ? Number(r.created_by_id)
          : null,
      updatedById:
        r.updated_by_id !== undefined && r.updated_by_id !== null
          ? Number(r.updated_by_id)
          : null,
      deletedById:
        r.deleted_by_id !== undefined && r.deleted_by_id !== null
          ? Number(r.deleted_by_id)
          : null,

      deleted: !!r.deleted,
      deletedAt: r.deleted_at ?? null,
      createdAt: r.created_at ?? r.createdAt ?? null,
      updatedAt: r.updated_at ?? r.updatedAt ?? null,

      category: r.category
        ? {
            id: Number(r.category.id),
            title: String(r.category.title ?? ""),
            slug: r.category.slug ?? null,
          }
        : null,

      tags: Array.isArray(r.tags)
        ? r.tags.map((tag: any) => ({
            id: Number(tag.id),
            name: String(tag.name ?? ""),
            slug: tag.slug ?? null,
          }))
        : [],

      relatedProducts: Array.isArray(r.relatedProducts)
        ? r.relatedProducts.map((product: any, index: number) => ({
            id: Number(product.id),
            title: String(product.title ?? ""),
            slug: product.slug ?? null,
            thumbnail: product.thumbnail ?? null,
            price:
              product.price !== undefined && product.price !== null
                ? Number(product.price)
                : null,
            position:
              product.PostRelatedProduct?.position !== undefined &&
              product.PostRelatedProduct?.position !== null
                ? Number(product.PostRelatedProduct.position)
                : index,
          }))
        : [],
    });
  };

  private buildIncludes() {
    const includes: any[] = [];

    if (this.models.PostCategory) {
      includes.push({
        model: this.models.PostCategory,
        as: "category",
        attributes: ["id", "title", "slug"],
        required: false,
      });
    }

    if (this.models.PostTag && this.models.PostTagMap) {
      includes.push({
        model: this.models.PostTag,
        as: "tags",
        attributes: ["id", "name", "slug"],
        through: { attributes: [] },
        required: false,
      });
    }

    if (this.models.Product && this.models.PostRelatedProduct) {
      includes.push({
        model: this.models.Product,
        as: "relatedProducts",
        attributes: ["id", "title", "slug", "thumbnail", "price"],
        through: { attributes: ["position"] },
        required: false,
      });
    }

    return includes;
  }

  private async resolvePosition(input: { position?: number | null }) {
    const position = input.position ?? null;
    if (position != null) return Number(position);

    let maxPos = await this.models.Post.max("position", {
      where: { deleted: 0 },
    });
    maxPos = Number(maxPos) || 0;

    return maxPos + 1;
  }

  private async syncPostTags(
    postId: number,
    tagIds: number[],
    transaction?: any,
  ) {
    const PostTagMap = this.models.PostTagMap;
    if (!PostTagMap) return;

    await PostTagMap.destroy({
      where: { post_id: postId },
      transaction,
    });

    if (!tagIds.length) return;

    await PostTagMap.bulkCreate(
      tagIds.map((tagId) => ({
        post_id: postId,
        post_tag_id: tagId,
      })),
      { transaction },
    );
  }

  private async syncRelatedProducts(
    postId: number,
    productIds: number[],
    transaction?: any,
  ) {
    const PostRelatedProduct = this.models.PostRelatedProduct;
    if (!PostRelatedProduct) return;

    await PostRelatedProduct.destroy({
      where: { post_id: postId },
      transaction,
    });

    if (!productIds.length) return;

    await PostRelatedProduct.bulkCreate(
      productIds.map((productId, index) => ({
        post_id: postId,
        product_id: productId,
        position: index,
      })),
      { transaction },
    );
  }

  async existsCategory(id: number): Promise<boolean> {
    if (!this.models.PostCategory) return false;

    const count = await this.models.PostCategory.count({
      where: {
        id: Number(id),
        ...(this.models.PostCategory.rawAttributes?.deleted
          ? { deleted: 0 }
          : {}),
      },
    });

    return Number(count) > 0;
  }

  async isCategoryUsable(id: number): Promise<boolean> {
    if (!this.models.PostCategory) return false;

    const where: any = {
      id: Number(id),
      ...(this.models.PostCategory.rawAttributes?.deleted
        ? { deleted: 0 }
        : {}),
    };

    if (this.models.PostCategory.rawAttributes?.status) {
      where.status = "active";
    }

    const count = await this.models.PostCategory.count({ where });
    return Number(count) > 0;
  }

  async findExistingTagIds(ids: number[]): Promise<number[]> {
    if (!this.models.PostTag || !ids.length) return [];

    const rows = await this.models.PostTag.findAll({
      attributes: ["id"],
      where: {
        id: { [Op.in]: ids.map(Number) },
        ...(this.models.PostTag.rawAttributes?.deleted ? { deleted: 0 } : {}),
      },
    });

    return rows
      .map((row: any) => Number(this.toPlain(row).id))
      .filter((id: number) => Number.isInteger(id) && id > 0);
  }

  async findUsableTagIds(ids: number[]): Promise<number[]> {
    if (!this.models.PostTag || !ids.length) return [];

    const where: any = {
      id: { [Op.in]: ids.map(Number) },
      ...(this.models.PostTag.rawAttributes?.deleted ? { deleted: 0 } : {}),
    };

    if (this.models.PostTag.rawAttributes?.status) {
      where.status = "active";
    }

    const rows = await this.models.PostTag.findAll({
      attributes: ["id"],
      where,
    });

    return rows
      .map((row: any) => Number(this.toPlain(row).id))
      .filter((id: number) => Number.isInteger(id) && id > 0);
  }

  async findExistingRelatedProductIds(ids: number[]): Promise<number[]> {
    if (!this.models.Product || !ids.length) return [];

    const rows = await this.models.Product.findAll({
      attributes: ["id"],
      where: {
        id: { [Op.in]: ids.map(Number) },
        ...(this.models.Product.rawAttributes?.deleted ? { deleted: 0 } : {}),
      },
    });

    return rows
      .map((row: any) => Number(this.toPlain(row).id))
      .filter((id: number) => Number.isInteger(id) && id > 0);
  }

  async findUsableRelatedProductIds(ids: number[]): Promise<number[]> {
    if (!this.models.Product || !ids.length) return [];

    const where: any = {
      id: { [Op.in]: ids.map(Number) },
      ...(this.models.Product.rawAttributes?.deleted ? { deleted: 0 } : {}),
    };

    if (this.models.Product.rawAttributes?.status) {
      where.status = "active";
    }

    const rows = await this.models.Product.findAll({
      attributes: ["id"],
      where,
    });

    return rows
      .map((row: any) => Number(this.toPlain(row).id))
      .filter((id: number) => Number.isInteger(id) && id > 0);
  }

  async list(filter: PostListFilter) {
    const {
      page = 1,
      limit = 10,
      q,
      categoryId = null,
      tagId = null,
      relatedProductId = null,
      status = "all",
      featured,
      missingThumbnail,
      missingSeo,
      publishedOnly,
      sortBy = "id",
      order = "DESC",
    } = filter;

    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.max(1, Number(limit) || 10);
    const safeOrder = String(order).toUpperCase() === "ASC" ? "ASC" : "DESC";
    const offset = (safePage - 1) * safeLimit;

    const whereParts: string[] = ["p.deleted = 0"];
    const replacements: Record<string, any> = {
      limit: safeLimit,
      offset,
    };

    if (categoryId !== null) {
      if (Array.isArray(categoryId)) {
        whereParts.push(`p.post_category_id IN (:categoryIds)`);
        replacements.categoryIds = categoryId.map(Number);
      } else {
        whereParts.push(`p.post_category_id = :categoryId`);
        replacements.categoryId = Number(categoryId);
      }
    }

    if (tagId !== null) {
      if (Array.isArray(tagId)) {
        whereParts.push(`
          EXISTS (
            SELECT 1
            FROM post_tag_maps ptm
            WHERE ptm.post_id = p.id
              AND ptm.post_tag_id IN (:tagIds)
          )
        `);
        replacements.tagIds = tagId.map(Number);
      } else {
        whereParts.push(`
          EXISTS (
            SELECT 1
            FROM post_tag_maps ptm
            WHERE ptm.post_id = p.id
              AND ptm.post_tag_id = :tagId
          )
        `);
        replacements.tagId = Number(tagId);
      }
    }

    if (relatedProductId !== null) {
      whereParts.push(`
        EXISTS (
          SELECT 1
          FROM post_related_products prp
          WHERE prp.post_id = p.id
            AND prp.product_id = :relatedProductId
        )
      `);
      replacements.relatedProductId = Number(relatedProductId);
    }

    if (status !== "all") {
      whereParts.push(`p.status = :status`);
      replacements.status = status;
    }

    if (typeof featured === "boolean") {
      whereParts.push(`p.featured = :featured`);
      replacements.featured = featured ? 1 : 0;
    }

    if (typeof missingThumbnail === "boolean") {
      if (missingThumbnail) {
        whereParts.push(`(p.thumbnail IS NULL OR TRIM(p.thumbnail) = '')`);
      } else {
        whereParts.push(
          `(p.thumbnail IS NOT NULL AND TRIM(p.thumbnail) <> '')`,
        );
      }
    }

    if (typeof missingSeo === "boolean") {
      if (missingSeo) {
        whereParts.push(`
          (
            p.seo_title IS NULL OR TRIM(p.seo_title) = '' OR
            p.seo_description IS NULL OR TRIM(p.seo_description) = ''
          )
        `);
      } else {
        whereParts.push(`
          (
            p.seo_title IS NOT NULL AND TRIM(p.seo_title) <> '' AND
            p.seo_description IS NOT NULL AND TRIM(p.seo_description) <> ''
          )
        `);
      }
    }

    if (typeof publishedOnly === "boolean") {
      whereParts.push(
        publishedOnly ? `p.status = 'published'` : `p.status <> 'published'`,
      );
    }

    if (q && String(q).trim()) {
      whereParts.push(
        `(p.title LIKE :q OR p.slug LIKE :q OR p.excerpt LIKE :q)`,
      );
      replacements.q = `%${String(q).trim()}%`;
    }

    const baseDataset = `
      SELECT
        p.id,
        p.post_category_id,
        p.title,
        p.slug,
        p.excerpt,
        p.content,
        p.thumbnail,
        p.status,
        p.featured,
        p.position,
        p.published_at,
        p.seo_title,
        p.seo_description,
        p.seo_keywords,
        p.og_image,
        p.canonical_url,
        p.view_count,
        p.created_by_id,
        p.updated_by_id,
        p.deleted_by_id,
        p.deleted,
        p.deleted_at,
        p.created_at,
        p.updated_at
      FROM posts p
      WHERE ${whereParts.join(" AND ")}
    `;

    const sortMap: Record<string, string> = {
      id: "base.id",
      title: "base.title",
      position: "COALESCE(base.position, 999999)",
      publishedAt: "COALESCE(base.published_at, '1970-01-01 00:00:00')",
      createdAt: "base.created_at",
      updatedAt: "base.updated_at",
      viewCount: "base.view_count",
    };

    const sortExpr = sortMap[sortBy] || "base.id";
    const sequelize = this.models.Post.sequelize as any;

    const [countRows] = await sequelize.query(
      `
      SELECT COUNT(*) AS total
      FROM (${baseDataset}) base
      `,
      { replacements },
    );

    const count = Number((countRows as any[])[0]?.total ?? 0);

    const [idRows] = await sequelize.query(
      `
      SELECT base.id
      FROM (${baseDataset}) base
      ORDER BY ${sortExpr} ${safeOrder}, base.id DESC
      LIMIT :limit OFFSET :offset
      `,
      { replacements },
    );

    const ids = (idRows as any[]).map((r) => Number(r.id));

    const [summaryRows] = await sequelize.query(
      `
      SELECT
        COUNT(*) AS totalItems,
        SUM(CASE WHEN base.status = 'draft' THEN 1 ELSE 0 END) AS draftCount,
        SUM(CASE WHEN base.status = 'published' THEN 1 ELSE 0 END) AS publishedCount,
        SUM(CASE WHEN base.status = 'inactive' THEN 1 ELSE 0 END) AS inactiveCount,
        SUM(CASE WHEN base.status = 'archived' THEN 1 ELSE 0 END) AS archivedCount,
        SUM(CASE WHEN base.featured = 1 THEN 1 ELSE 0 END) AS featuredCount,
        SUM(CASE WHEN base.thumbnail IS NULL OR TRIM(base.thumbnail) = '' THEN 1 ELSE 0 END) AS missingThumbnailCount,
        SUM(
          CASE
            WHEN base.seo_title IS NULL OR TRIM(base.seo_title) = '' OR
                 base.seo_description IS NULL OR TRIM(base.seo_description) = ''
            THEN 1 ELSE 0
          END
        ) AS missingSeoCount
      FROM (${baseDataset}) base
      `,
      { replacements },
    );

    const summary = {
      totalItems: Number((summaryRows as any[])[0]?.totalItems ?? 0),
      draftCount: Number((summaryRows as any[])[0]?.draftCount ?? 0),
      publishedCount: Number((summaryRows as any[])[0]?.publishedCount ?? 0),
      inactiveCount: Number((summaryRows as any[])[0]?.inactiveCount ?? 0),
      archivedCount: Number((summaryRows as any[])[0]?.archivedCount ?? 0),
      featuredCount: Number((summaryRows as any[])[0]?.featuredCount ?? 0),
      missingThumbnailCount: Number(
        (summaryRows as any[])[0]?.missingThumbnailCount ?? 0,
      ),
      missingSeoCount: Number((summaryRows as any[])[0]?.missingSeoCount ?? 0),
    };

    if (!ids.length) {
      return { rows: [], count, summary };
    }

    const preserveOrderLiteral = literal(`FIELD(Post.id, ${ids.join(",")})`);

    const rows = await this.models.Post.findAll({
      where: {
        id: { [Op.in]: ids },
        deleted: 0,
      },
      include: this.buildIncludes(),
      distinct: true,
      subQuery: false,
      order: [[preserveOrderLiteral, "ASC"]],
    });

    return { rows: rows.map(this.mapRow), count, summary };
  }

  async findById(id: number) {
    const row = await this.models.Post.findOne({
      where: { id, deleted: 0 },
      include: this.buildIncludes(),
      subQuery: false,
    });

    return row ? this.mapRow(row) : null;
  }

  async findBySlug(slug: string) {
    const row = await this.models.Post.findOne({
      where: { slug, deleted: 0, status: "published" },
      include: this.buildIncludes(),
      subQuery: false,
    });

    return row ? this.mapRow(row) : null;
  }

  async findRelatedPostsByProductId(
    productId: number,
    options?: {
      limit?: number;
      excludePostId?: number | null;
    },
  ) {
    const safeProductId = Number(productId);
    if (!Number.isInteger(safeProductId) || safeProductId <= 0) {
      return [];
    }

    const safeLimit = Math.max(1, Number(options?.limit ?? 3) || 3);
    const excludePostId =
      options?.excludePostId !== undefined && options?.excludePostId !== null
        ? Number(options.excludePostId)
        : null;

    const whereParts: string[] = [
      "p.deleted = 0",
      "p.status = 'published'",
      `
      EXISTS (
        SELECT 1
        FROM post_related_products prp
        WHERE prp.post_id = p.id
          AND prp.product_id = :productId
      )
      `,
    ];

    const replacements: Record<string, any> = {
      productId: safeProductId,
      limit: safeLimit,
    };

    if (excludePostId && Number.isInteger(excludePostId) && excludePostId > 0) {
      whereParts.push("p.id <> :excludePostId");
      replacements.excludePostId = excludePostId;
    }

    const sequelize = this.models.Post.sequelize as any;

    const [idRows] = await sequelize.query(
      `
      SELECT p.id
      FROM posts p
      WHERE ${whereParts.join(" AND ")}
      ORDER BY
        p.featured DESC,
        COALESCE(p.published_at, '1970-01-01 00:00:00') DESC,
        p.id DESC
      LIMIT :limit
      `,
      { replacements },
    );

    const ids = (idRows as any[]).map((row) => Number(row.id));

    if (!ids.length) {
      return [];
    }

    const preserveOrderLiteral = literal(`FIELD(Post.id, ${ids.join(",")})`);

    const rows = await this.models.Post.findAll({
      where: {
        id: { [Op.in]: ids },
        deleted: 0,
      },
      include: this.buildIncludes(),
      distinct: true,
      subQuery: false,
      order: [[preserveOrderLiteral, "ASC"]],
    });

    return rows.map(this.mapRow);
  }

  async create(input: CreatePostInput) {
    const transaction = await this.models.Post.sequelize.transaction();

    try {
      const position = await this.resolvePosition(input);

      const row = await this.models.Post.create(
        {
          post_category_id: input.postCategoryId ?? null,
          title: input.title,
          excerpt: input.excerpt ?? null,
          content: input.content ?? null,
          thumbnail: input.thumbnail ?? null,

          status: input.status ?? "draft",
          featured: !!input.featured,
          position,
          published_at: input.publishedAt ?? null,

          seo_title: input.seoTitle ?? null,
          seo_description: input.seoDescription ?? null,
          seo_keywords: input.seoKeywords ?? null,
          og_image: input.ogImage ?? null,
          canonical_url: input.canonicalUrl ?? null,

          created_by_id: input.createdById ?? null,
          updated_by_id: input.updatedById ?? null,
          deleted_by_id: null,

          deleted: 0,
          deleted_at: null,
          view_count: 0,
        },
        { transaction },
      );

      await this.syncPostTags(Number(row.id), input.tagIds ?? [], transaction);
      await this.syncRelatedProducts(
        Number(row.id),
        input.relatedProductIds ?? [],
        transaction,
      );

      await transaction.commit();

      const fresh = await this.findById(Number(row.id));
      if (!fresh) throw new Error("Post not found after create");
      return fresh;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async update(id: number, patch: UpdatePostPatch) {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error("Post not found");
    }

    const transaction = await this.models.Post.sequelize.transaction();

    try {
      const values: any = {};

      if (patch.postCategoryId !== undefined) {
        values.post_category_id = patch.postCategoryId;
      }

      if (patch.title !== undefined) values.title = patch.title;
      if (patch.excerpt !== undefined) values.excerpt = patch.excerpt;
      if (patch.content !== undefined) values.content = patch.content;
      if (patch.thumbnail !== undefined) values.thumbnail = patch.thumbnail;

      if (patch.status !== undefined) values.status = patch.status;
      if (patch.featured !== undefined)
        values.featured = patch.featured ? 1 : 0;
      if (patch.position !== undefined) values.position = patch.position;
      if (patch.publishedAt !== undefined)
        values.published_at = patch.publishedAt;

      if (patch.seoTitle !== undefined) values.seo_title = patch.seoTitle;
      if (patch.seoDescription !== undefined) {
        values.seo_description = patch.seoDescription;
      }
      if (patch.seoKeywords !== undefined)
        values.seo_keywords = patch.seoKeywords;
      if (patch.ogImage !== undefined) values.og_image = patch.ogImage;
      if (patch.canonicalUrl !== undefined) {
        values.canonical_url = patch.canonicalUrl;
      }

      if (patch.updatedById !== undefined)
        values.updated_by_id = patch.updatedById;
      if (patch.deletedById !== undefined)
        values.deleted_by_id = patch.deletedById;

      if (patch.deleted !== undefined) {
        values.deleted = patch.deleted ? 1 : 0;
        values.deleted_at = patch.deleted ? new Date() : null;
      }

      await this.models.Post.update(values, {
        where: { id, deleted: 0 },
        transaction,
      });

      if (patch.tagIds !== undefined) {
        await this.syncPostTags(id, patch.tagIds ?? [], transaction);
      }

      if (patch.relatedProductIds !== undefined) {
        await this.syncRelatedProducts(
          id,
          patch.relatedProductIds ?? [],
          transaction,
        );
      }

      const row = await this.models.Post.findOne({
        where: { id, deleted: 0 },
        transaction,
      });

      if (!row) {
        throw new Error("Post not found");
      }

      Object.entries(values).forEach(([key, value]) => {
        row.set(key, value);
      });

      await row.save({ transaction });

      const fresh = await this.findById(id);
      if (!fresh) throw new Error("Post not found after update");
      return fresh;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async changeStatus(id: number, status: PostStatus) {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error("Post not found");
    }

    const values: any = { status };

    if (status === "published" && !existing.props.publishedAt) {
      values.published_at = new Date();
    }

    await this.models.Post.update(values, {
      where: { id, deleted: 0 },
    });
  }

  async softDelete(id: number, deletedById?: number | null) {
    const affected = await this.models.Post.update(
      {
        deleted: 1,
        deleted_at: new Date(),
        ...(deletedById !== undefined ? { deleted_by_id: deletedById } : {}),
      },
      { where: { id, deleted: 0 } },
    );

    const count = Array.isArray(affected)
      ? Number(affected[0] ?? 0)
      : Number(affected ?? 0);

    if (count <= 0) {
      throw new Error("Post not found");
    }
  }

  async bulkEdit(ids: number[], patch: UpdatePostPatch) {
    const values: any = {};

    if (patch.postCategoryId !== undefined)
      values.post_category_id = patch.postCategoryId;
    if (patch.title !== undefined) values.title = patch.title;
    if (patch.excerpt !== undefined) values.excerpt = patch.excerpt;
    if (patch.content !== undefined) values.content = patch.content;
    if (patch.thumbnail !== undefined) values.thumbnail = patch.thumbnail;
    if (patch.status !== undefined) values.status = patch.status;
    if (patch.featured !== undefined) values.featured = patch.featured ? 1 : 0;
    if (patch.position !== undefined) values.position = patch.position;
    if (patch.publishedAt !== undefined)
      values.published_at = patch.publishedAt;

    if (patch.seoTitle !== undefined) values.seo_title = patch.seoTitle;
    if (patch.seoDescription !== undefined)
      values.seo_description = patch.seoDescription;
    if (patch.seoKeywords !== undefined)
      values.seo_keywords = patch.seoKeywords;
    if (patch.ogImage !== undefined) values.og_image = patch.ogImage;
    if (patch.canonicalUrl !== undefined)
      values.canonical_url = patch.canonicalUrl;

    if (patch.updatedById !== undefined)
      values.updated_by_id = patch.updatedById;
    if (patch.deletedById !== undefined)
      values.deleted_by_id = patch.deletedById;

    if (patch.deleted !== undefined) {
      values.deleted = patch.deleted ? 1 : 0;
      values.deleted_at = patch.deleted ? new Date() : null;
    }

    const [affected] = await this.models.Post.update(values, {
      where: {
        id: { [Op.in]: ids.map(Number) },
        deleted: 0,
      },
    });

    return Number(affected ?? 0);
  }

  async reorderPositions(
    pairs: { id: number; position: number }[],
    updatedById?: number,
  ) {
    const ids = pairs.map((p) => Number(p.id));

    const whenClauses = pairs
      .map((p) => `WHEN ${Number(p.id)} THEN ${Number(p.position)}`)
      .join(" ");

    const setUpdated =
      updatedById !== undefined ? `, updated_by_id = :updatedById` : "";

    const sql = `
      UPDATE posts
      SET position = CASE id ${whenClauses} END
      ${setUpdated}
      WHERE id IN (:ids) AND deleted = 0
    `;

    const sequelize = this.models.Post.sequelize as any;

    const [result] = await sequelize.query(sql, {
      replacements: { ids, updatedById },
    });

    const affected = result?.affectedRows ?? result ?? ids.length;
    return Number(affected);
  }

  async increaseViewCount(id: number, by = 1): Promise<void> {
    await this.models.Post.increment(
      { view_count: Math.max(1, Number(by || 1)) },
      { where: { id, deleted: 0 } },
    );
  }
}
