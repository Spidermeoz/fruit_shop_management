import { Op, literal } from "sequelize";
import { PostCategory } from "../../domain/post-categories/PostCategory";
import type {
  CreatePostCategoryInput,
  PostCategoryRepository,
  UpdatePostCategoryPatch,
} from "../../domain/post-categories/PostCategoryRepository";
import type {
  PostCategoryListFilter,
  PostCategoryStatus,
} from "../../domain/post-categories/types";

type Models = {
  PostCategory: any;
};

export class SequelizePostCategoryRepository implements PostCategoryRepository {
  constructor(private models: Models) {}

  private toPlain(row: any) {
    if (!row) return row;
    return typeof row.get === "function" ? row.get({ plain: true }) : row;
  }

  private mapTreeNode(row: any) {
    const r = this.toPlain(row);
    if (!r) return null;

    const children = Array.isArray(r.children)
      ? r.children.map((child: any) => this.mapTreeNode(child)).filter(Boolean)
      : [];

    return {
      id: Number(r.id),
      title: String(r.title ?? "").trim(),
      slug: r.slug ?? null,
      status: (r.status ?? "active") as PostCategoryStatus,
      position:
        r.position !== undefined && r.position !== null
          ? Number(r.position)
          : null,
      parentId:
        r.parent_id !== undefined && r.parent_id !== null
          ? Number(r.parent_id)
          : null,
      children,
    };
  }

  private mapRow = (row: any): PostCategory => {
    const r = this.toPlain(row);

    const mappedParent =
      r.parent && r.parent.id
        ? {
            id: Number(r.parent.id),
            title: String(r.parent.title ?? "").trim(),
            slug: r.parent.slug ?? null,
          }
        : null;

    const mappedChildren = Array.isArray(r.children)
      ? r.children.map((child: any) => this.mapTreeNode(child)).filter(Boolean)
      : [];

    return PostCategory.create({
      id: Number(r.id),
      title: String(r.title ?? ""),
      parentId:
        r.parent_id !== undefined && r.parent_id !== null
          ? Number(r.parent_id)
          : null,
      description: r.description ?? null,
      thumbnail: r.thumbnail ?? null,
      status: (r.status ?? "active") as PostCategoryStatus,
      position:
        r.position !== undefined && r.position !== null
          ? Number(r.position)
          : null,
      slug: r.slug ?? null,

      seoTitle: r.seo_title ?? null,
      seoDescription: r.seo_description ?? null,
      seoKeywords: r.seo_keywords ?? null,
      ogImage: r.og_image ?? null,
      canonicalUrl: r.canonical_url ?? null,

      deleted: !!r.deleted,
      deletedAt: r.deleted_at ?? null,
      createdAt: r.created_at ?? r.createdAt,
      updatedAt: r.updated_at ?? r.updatedAt,

      parent: mappedParent,
      children: mappedChildren,
    });
  };

  async list(filter: PostCategoryListFilter) {
    const {
      page = 1,
      limit = 10,
      q,
      parentId = null,
      status = "all",
      missingThumbnail,
      missingSeo,
      sortBy = "id",
      order = "DESC",
    } = filter;

    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.max(1, Number(limit) || 10);
    const safeOrder = String(order).toUpperCase() === "ASC" ? "ASC" : "DESC";
    const offset = (safePage - 1) * safeLimit;

    const whereParts: string[] = ["c.deleted = 0"];
    const replacements: Record<string, any> = {
      limit: safeLimit,
      offset,
    };

    if (parentId !== null) {
      if (Array.isArray(parentId)) {
        whereParts.push(`c.parent_id IN (:parentIds)`);
        replacements.parentIds = parentId.map(Number);
      } else if (Number(parentId) === 0) {
        whereParts.push(`c.parent_id IS NULL`);
      } else {
        whereParts.push(`c.parent_id = :parentId`);
        replacements.parentId = Number(parentId);
      }
    }

    if (status !== "all") {
      whereParts.push(`c.status = :status`);
      replacements.status = status;
    }

    if (typeof missingThumbnail === "boolean") {
      if (missingThumbnail) {
        whereParts.push(`
          (
            (c.thumbnail IS NULL OR TRIM(c.thumbnail) = '') AND
            (c.og_image IS NULL OR TRIM(c.og_image) = '')
          )
        `);
      } else {
        whereParts.push(`
          (
            (c.thumbnail IS NOT NULL AND TRIM(c.thumbnail) <> '') OR
            (c.og_image IS NOT NULL AND TRIM(c.og_image) <> '')
          )
        `);
      }
    }

    if (typeof missingSeo === "boolean") {
      if (missingSeo) {
        whereParts.push(`
          (
            c.seo_title IS NULL OR TRIM(c.seo_title) = '' OR
            c.seo_description IS NULL OR TRIM(c.seo_description) = ''
          )
        `);
      } else {
        whereParts.push(`
          (
            c.seo_title IS NOT NULL AND TRIM(c.seo_title) <> '' AND
            c.seo_description IS NOT NULL AND TRIM(c.seo_description) <> ''
          )
        `);
      }
    }

    if (q && String(q).trim()) {
      whereParts.push(`(c.title LIKE :q OR c.slug LIKE :q)`);
      replacements.q = `%${String(q).trim()}%`;
    }

    const baseDataset = `
      SELECT
        c.id,
        c.title,
        c.parent_id,
        c.thumbnail,
        c.og_image,
        c.status,
        c.position,
        c.slug,
        c.seo_title,
        c.seo_description,
        c.created_at,
        c.updated_at
      FROM post_categories c
      WHERE ${whereParts.join(" AND ")}
    `;

    const sortMap: Record<string, string> = {
      id: "base.id",
      title: "base.title",
      position: "COALESCE(base.position, 999999)",
      createdAt: "base.created_at",
      updatedAt: "base.updated_at",
    };

    const sortExpr = sortMap[sortBy] || "base.id";
    const sequelize = this.models.PostCategory.sequelize as any;

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
        SUM(CASE WHEN base.status = 'active' THEN 1 ELSE 0 END) AS activeCount,
        SUM(CASE WHEN base.status <> 'active' THEN 1 ELSE 0 END) AS inactiveCount,
        SUM(CASE WHEN base.parent_id IS NULL THEN 1 ELSE 0 END) AS rootCount,
        SUM(CASE WHEN base.parent_id IS NOT NULL THEN 1 ELSE 0 END) AS childCount,
        SUM(
          CASE
            WHEN
              (base.thumbnail IS NULL OR TRIM(base.thumbnail) = '') AND
              (base.og_image IS NULL OR TRIM(base.og_image) = '')
            THEN 1 ELSE 0
          END
        ) AS missingThumbnailCount,
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
      activeCount: Number((summaryRows as any[])[0]?.activeCount ?? 0),
      inactiveCount: Number((summaryRows as any[])[0]?.inactiveCount ?? 0),
      rootCount: Number((summaryRows as any[])[0]?.rootCount ?? 0),
      childCount: Number((summaryRows as any[])[0]?.childCount ?? 0),
      missingThumbnailCount: Number(
        (summaryRows as any[])[0]?.missingThumbnailCount ?? 0,
      ),
      missingSeoCount: Number((summaryRows as any[])[0]?.missingSeoCount ?? 0),
    };

    if (!ids.length) {
      return { rows: [], count, summary };
    }

    const preserveOrderLiteral = literal(
      `FIELD(PostCategory.id, ${ids.join(",")})`,
    );

    const rows = await this.models.PostCategory.findAll({
      where: {
        id: { [Op.in]: ids },
        deleted: 0,
      },
      include: [
        {
          model: this.models.PostCategory,
          as: "parent",
          required: false,
          attributes: ["id", "title", "slug"],
        },
      ],
      order: [[preserveOrderLiteral, "ASC"]],
    });

    return { rows: rows.map(this.mapRow), count, summary };
  }

  async findById(id: number) {
    const row = await this.models.PostCategory.findOne({
      where: { id, deleted: 0 },
      include: [
        {
          model: this.models.PostCategory,
          as: "parent",
          required: false,
          attributes: ["id", "title", "slug"],
        },
        {
          model: this.models.PostCategory,
          as: "children",
          required: false,
          where: { deleted: 0 },
          attributes: [
            "id",
            "title",
            "slug",
            "status",
            "position",
            "parent_id",
          ],
        },
      ],
    });

    return row ? this.mapRow(row) : null;
  }

  async findBySlug(slug: string) {
    const row = await this.models.PostCategory.findOne({
      where: { slug, deleted: 0 },
      include: [
        {
          model: this.models.PostCategory,
          as: "parent",
          required: false,
          attributes: ["id", "title", "slug"],
        },
      ],
    });

    return row ? this.mapRow(row) : null;
  }

  private async resolvePosition(input: {
    parentId?: number | null;
    position?: number | null;
  }) {
    let position = input.position ?? null;
    if (position != null) return Number(position);

    const where: any = {
      deleted: 0,
      parent_id:
        input.parentId !== undefined && input.parentId !== null
          ? Number(input.parentId)
          : null,
    };

    let maxPos = await this.models.PostCategory.max("position", { where });
    maxPos = Number(maxPos) || 0;

    return maxPos + 1;
  }

  async create(input: CreatePostCategoryInput) {
    const position = await this.resolvePosition(input);

    const row = await this.models.PostCategory.create({
      title: input.title,
      parent_id: input.parentId ?? null,
      description: input.description ?? null,
      thumbnail: input.thumbnail ?? null,
      status: input.status ?? "active",
      position,
      slug: input.slug ?? null,

      seo_title: input.seoTitle ?? null,
      seo_description: input.seoDescription ?? null,
      seo_keywords: input.seoKeywords ?? null,
      og_image: input.ogImage ?? null,
      canonical_url: input.canonicalUrl ?? null,

      deleted: 0,
      deleted_at: null,
    });

    const fresh = await this.findById(Number(row.id));
    if (!fresh) throw new Error("Post category not found after create");
    return fresh;
  }

  async update(id: number, patch: UpdatePostCategoryPatch) {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error("Post category not found");
    }

    const values: any = {};

    if (patch.title !== undefined) values.title = patch.title;
    if (patch.parentId !== undefined) values.parent_id = patch.parentId;
    if (patch.description !== undefined) values.description = patch.description;
    if (patch.thumbnail !== undefined) values.thumbnail = patch.thumbnail;
    if (patch.status !== undefined) values.status = patch.status;
    if (patch.position !== undefined) values.position = patch.position;
    if (patch.slug !== undefined) values.slug = patch.slug;

    if (patch.seoTitle !== undefined) values.seo_title = patch.seoTitle;
    if (patch.seoDescription !== undefined) {
      values.seo_description = patch.seoDescription;
    }
    if (patch.seoKeywords !== undefined) {
      values.seo_keywords = patch.seoKeywords;
    }
    if (patch.ogImage !== undefined) values.og_image = patch.ogImage;
    if (patch.canonicalUrl !== undefined) {
      values.canonical_url = patch.canonicalUrl;
    }

    if (patch.deleted !== undefined) {
      values.deleted = patch.deleted ? 1 : 0;
      values.deleted_at = patch.deleted ? new Date() : null;
    }

    const [affected] = await this.models.PostCategory.update(values, {
      where: { id, deleted: 0 },
    });

    if (!Number(affected)) {
      throw new Error("Post category not found");
    }

    const fresh = await this.findById(id);
    if (!fresh) throw new Error("Post category not found after update");
    return fresh;
  }

  async changeStatus(id: number, status: PostCategoryStatus) {
    const [affected] = await this.models.PostCategory.update(
      { status },
      { where: { id, deleted: 0 } },
    );

    if (!Number(affected)) {
      throw new Error("Post category not found");
    }
  }

  async softDelete(id: number) {
    const [affected] = await this.models.PostCategory.update(
      { deleted: 1, deleted_at: new Date() },
      { where: { id, deleted: 0 } },
    );

    if (!Number(affected)) {
      throw new Error("Post category not found");
    }
  }

  async reorderPositions(pairs: { id: number; position: number }[]) {
    const ids = pairs.map((p) => Number(p.id));

    const whenClauses = pairs
      .map((p) => `WHEN ${Number(p.id)} THEN ${Number(p.position)}`)
      .join(" ");

    const sql = `
      UPDATE post_categories
      SET position = CASE id ${whenClauses} END
      WHERE id IN (:ids)
    `;

    const sequelize = this.models.PostCategory.sequelize as any;
    const [result] = await sequelize.query(sql, {
      replacements: { ids },
    });

    const affected = result?.affectedRows ?? result ?? ids.length;
    return Number(affected);
  }

  async hasChildren(id: number) {
    const total = await this.models.PostCategory.count({
      where: {
        parent_id: Number(id),
        deleted: 0,
      },
    });

    return Number(total) > 0;
  }

  async countActivePostsUsingCategory(id: number) {
    const sequelize = this.models.PostCategory.sequelize as any;

    const [rows] = await sequelize.query(
      `
      SELECT COUNT(*) AS total
      FROM posts p
      WHERE p.post_category_id = :id
        AND (p.deleted = 0 OR p.deleted IS NULL)
    `,
      {
        replacements: { id: Number(id) },
      },
    );

    return Number((rows as any[])[0]?.total ?? 0);
  }
}
