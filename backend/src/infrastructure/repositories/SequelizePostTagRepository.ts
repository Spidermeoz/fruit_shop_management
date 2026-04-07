import { Op, QueryTypes, literal } from "sequelize";
import { PostTag } from "../../domain/post-tags/PostTag";
import type {
  BulkEditPostTagsInput,
  CreatePostTagInput,
  PostTagRepository,
  ReorderPostTagPositionsInput,
  UpdatePostTagPatch,
} from "../../domain/post-tags/PostTagRepository";
import type {
  PostTagListFilter,
  PostTagListSummary,
  PostTagStatus,
} from "../../domain/post-tags/types";

type Models = {
  PostTag: any;
  PostTagMap?: any;
};

export class SequelizePostTagRepository implements PostTagRepository {
  constructor(private models: Models) {}

  private toPlain(row: any) {
    if (!row) return row;
    return typeof row.get === "function" ? row.get({ plain: true }) : row;
  }

  private mapRow = (row: any): PostTag => {
    const r = this.toPlain(row);

    return PostTag.create({
      id: Number(r.id),
      name: String(r.name ?? ""),
      slug: r.slug ?? null,
      description: r.description ?? null,
      status: (r.status ?? "active") as PostTagStatus,
      position:
        r.position !== undefined && r.position !== null
          ? Number(r.position)
          : 0,
      deleted: !!r.deleted,
      deletedAt: r.deleted_at ?? null,
      createdAt: r.created_at ?? r.createdAt ?? null,
      updatedAt: r.updated_at ?? r.updatedAt ?? null,
    });
  };

  private get sequelize() {
    return this.models.PostTag.sequelize as any;
  }

  private normalizeSort(
    sortBy?: string,
    order?: string,
  ): {
    sortExpr: string;
    sortOrder: "ASC" | "DESC";
  } {
    const sortMap: Record<string, string> = {
      id: "base.id",
      name: "base.name",
      position: "COALESCE(base.position, 999999)",
      createdAt: "base.created_at",
      updatedAt: "base.updated_at",
    };

    const safeSortBy = sortMap[sortBy || "id"] ? sortBy || "id" : "id";
    const safeOrder = String(order).toUpperCase() === "ASC" ? "ASC" : "DESC";

    return {
      sortExpr: sortMap[safeSortBy],
      sortOrder: safeOrder,
    };
  }

  private buildBaseWhere(filter: { q?: string; status?: string }): {
    whereSql: string;
    replacements: Record<string, any>;
  } {
    const whereParts: string[] = ["t.deleted = 0"];
    const replacements: Record<string, any> = {};

    if (filter.status && filter.status !== "all") {
      whereParts.push("t.status = :status");
      replacements.status = filter.status;
    }

    if (filter.q && String(filter.q).trim()) {
      whereParts.push(
        "(t.name LIKE :q OR t.slug LIKE :q OR t.description LIKE :q)",
      );
      replacements.q = `%${String(filter.q).trim()}%`;
    }

    return {
      whereSql: whereParts.join(" AND "),
      replacements,
    };
  }

  private async ensureExists(id: number) {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error("Post tag not found");
    }
    return existing;
  }

  async list(filter: PostTagListFilter) {
    const {
      page = 1,
      limit = 10,
      q,
      status = "all",
      sortBy = "id",
      order = "DESC",
    } = filter;

    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.max(1, Number(limit) || 10);
    const offset = (safePage - 1) * safeLimit;

    const { whereSql, replacements: baseReplacements } = this.buildBaseWhere({
      q,
      status,
    });

    const replacements: Record<string, any> = {
      ...baseReplacements,
      limit: safeLimit,
      offset,
    };

    const baseDataset = `
      SELECT
        t.id,
        t.name,
        t.slug,
        t.description,
        t.status,
        t.position,
        t.created_at,
        t.updated_at
      FROM post_tags t
      WHERE ${whereSql}
    `;

    const { sortExpr, sortOrder } = this.normalizeSort(sortBy, order);

    const countRows = await this.sequelize.query(
      `
      SELECT COUNT(*) AS total
      FROM (${baseDataset}) base
      `,
      {
        replacements,
        type: QueryTypes.SELECT,
      },
    );

    const count = Number((countRows as any[])[0]?.total ?? 0);

    const idRows = await this.sequelize.query(
      `
      SELECT base.id
      FROM (${baseDataset}) base
      ORDER BY ${sortExpr} ${sortOrder}, base.id DESC
      LIMIT :limit OFFSET :offset
      `,
      {
        replacements,
        type: QueryTypes.SELECT,
      },
    );

    const ids = (idRows as any[]).map((r) => Number(r.id));

    const summary = await this.getSummary();

    if (!ids.length) {
      return { rows: [], count, summary };
    }

    const preserveOrderLiteral = literal(`FIELD(PostTag.id, ${ids.join(",")})`);

    const rows = await this.models.PostTag.findAll({
      where: {
        id: { [Op.in]: ids },
        deleted: 0,
      },
      order: [[preserveOrderLiteral, "ASC"]],
    });

    return {
      rows: rows.map(this.mapRow),
      count,
      summary,
    };
  }

  async getSummary(): Promise<PostTagListSummary> {
    const summaryRows = await this.sequelize.query(
      `
      SELECT
        COUNT(*) AS totalItems,
        SUM(CASE WHEN t.status = 'active' THEN 1 ELSE 0 END) AS activeCount,
        SUM(CASE WHEN t.status <> 'active' THEN 1 ELSE 0 END) AS inactiveCount,
        SUM(CASE WHEN t.description IS NULL OR TRIM(t.description) = '' THEN 1 ELSE 0 END) AS missingDescriptionCount,
        SUM(CASE WHEN t.slug IS NULL OR TRIM(t.slug) = '' THEN 1 ELSE 0 END) AS missingSlugCount,
        SUM(CASE WHEN t.position IS NULL OR t.position = 0 THEN 1 ELSE 0 END) AS zeroPositionCount,
        SUM(CASE WHEN COALESCE(u.post_count, 0) > 0 THEN 1 ELSE 0 END) AS usedCount,
        SUM(CASE WHEN COALESCE(u.post_count, 0) = 0 THEN 1 ELSE 0 END) AS unusedCount
      FROM post_tags t
      LEFT JOIN (
        SELECT
          ptm.post_tag_id,
          COUNT(DISTINCT ptm.post_id) AS post_count
        FROM post_tag_maps ptm
        GROUP BY ptm.post_tag_id
      ) u ON u.post_tag_id = t.id
      WHERE t.deleted = 0
      `,
      {
        type: QueryTypes.SELECT,
      },
    );

    const duplicateRows = await this.sequelize.query(
      `
      SELECT COUNT(*) AS duplicateNameCount
      FROM (
        SELECT LOWER(TRIM(name)) AS normalized_name
        FROM post_tags
        WHERE deleted = 0
        GROUP BY LOWER(TRIM(name))
        HAVING COUNT(*) > 1
      ) d
      `,
      {
        type: QueryTypes.SELECT,
      },
    );

    const summaryRow = (summaryRows as any[])[0] ?? {};
    const duplicateRow = (duplicateRows as any[])[0] ?? {};

    return {
      totalItems: Number(summaryRow.totalItems ?? 0),
      activeCount: Number(summaryRow.activeCount ?? 0),
      inactiveCount: Number(summaryRow.inactiveCount ?? 0),
      missingDescriptionCount: Number(summaryRow.missingDescriptionCount ?? 0),
      missingSlugCount: Number(summaryRow.missingSlugCount ?? 0),
      zeroPositionCount: Number(summaryRow.zeroPositionCount ?? 0),
      duplicateNameCount: Number(duplicateRow.duplicateNameCount ?? 0),
      usedCount: Number(summaryRow.usedCount ?? 0),
      unusedCount: Number(summaryRow.unusedCount ?? 0),
    };
  }

  async findById(id: number) {
    const row = await this.models.PostTag.findOne({
      where: { id, deleted: 0 },
    });

    return row ? this.mapRow(row) : null;
  }

  async findBySlug(slug: string) {
    const row = await this.models.PostTag.findOne({
      where: { slug, deleted: 0 },
    });

    return row ? this.mapRow(row) : null;
  }

  private async resolvePosition(input: { position?: number | null }) {
    const position = input.position ?? null;
    if (position != null) return Number(position);

    let maxPos = await this.models.PostTag.max("position", {
      where: { deleted: 0 },
    });
    maxPos = Number(maxPos) || 0;

    return maxPos + 1;
  }

  async create(input: CreatePostTagInput) {
    const position = await this.resolvePosition(input);

    const row = await this.models.PostTag.create({
      name: input.name,
      slug: input.slug ?? null,
      description: input.description ?? null,
      status: input.status ?? "active",
      position,
      deleted: 0,
      deleted_at: null,
    });

    const fresh = await this.findById(Number(row.id));
    if (!fresh) {
      throw new Error("Post tag not found after create");
    }

    return fresh;
  }

  async update(id: number, patch: UpdatePostTagPatch) {
    await this.ensureExists(id);

    const values: any = {};

    if (patch.name !== undefined) values.name = patch.name;
    if (patch.slug !== undefined) values.slug = patch.slug;
    if (patch.description !== undefined) values.description = patch.description;
    if (patch.status !== undefined) values.status = patch.status;
    if (patch.position !== undefined) values.position = patch.position;

    if (patch.deleted !== undefined) {
      values.deleted = patch.deleted ? 1 : 0;
      values.deleted_at = patch.deleted ? new Date() : null;
    }

    await this.models.PostTag.update(values, {
      where: { id, deleted: 0 },
    });

    const fresh = await this.findById(id);

    if (!fresh && patch.deleted) {
      throw new Error("Post tag was deleted successfully");
    }

    if (!fresh) {
      throw new Error("Post tag not found after update");
    }

    return fresh;
  }

  async changeStatus(id: number, status: PostTagStatus) {
    await this.ensureExists(id);

    await this.models.PostTag.update(
      { status },
      {
        where: { id, deleted: 0 },
      },
    );
  }

  async countPostsUsingTag(id: number): Promise<number> {
    const rows = await this.sequelize.query(
      `
      SELECT COUNT(DISTINCT ptm.post_id) AS total
      FROM post_tag_maps ptm
      WHERE ptm.post_tag_id = :id
      `,
      {
        replacements: { id },
        type: QueryTypes.SELECT,
      },
    );

    return Number((rows as any[])[0]?.total ?? 0);
  }

  async canDelete(
    id: number,
  ): Promise<{ canDelete: boolean; usageCount: number }> {
    await this.ensureExists(id);

    const usageCount = await this.countPostsUsingTag(id);

    return {
      canDelete: usageCount === 0,
      usageCount,
    };
  }

  async softDelete(id: number) {
    await this.ensureExists(id);

    const { canDelete, usageCount } = await this.canDelete(id);

    if (!canDelete) {
      throw new Error(
        `Cannot delete post tag because it is being used by ${usageCount} post(s)`,
      );
    }

    await this.models.PostTag.update(
      { deleted: 1, deleted_at: new Date() },
      { where: { id, deleted: 0 } },
    );
  }

  async bulkEdit(input: BulkEditPostTagsInput): Promise<number> {
    const ids = Array.from(
      new Set(
        (input.ids || []).map((id) => Number(id)).filter(Number.isFinite),
      ),
    );

    if (!ids.length) {
      throw new Error("No post tag ids provided");
    }

    const patch = input.patch || {};
    const values: any = {};

    if (patch.name !== undefined) {
      throw new Error("Bulk edit does not support updating name");
    }

    if (patch.slug !== undefined) {
      throw new Error("Bulk edit does not support updating slug");
    }

    if (patch.description !== undefined) values.description = patch.description;
    if (patch.status !== undefined) values.status = patch.status;
    if (patch.position !== undefined) {
      throw new Error(
        "Bulk edit does not support setting a single shared position",
      );
    }

    if (patch.deleted !== undefined) {
      if (patch.deleted) {
        const usageRows = await this.sequelize.query(
          `
          SELECT
            ptm.post_tag_id AS id,
            COUNT(DISTINCT ptm.post_id) AS usageCount
          FROM post_tag_maps ptm
          WHERE ptm.post_tag_id IN (:ids)
          GROUP BY ptm.post_tag_id
          `,
          {
            replacements: { ids },
            type: QueryTypes.SELECT,
          },
        );

        const blocked = (usageRows as any[]).filter(
          (row) => Number(row.usageCount) > 0,
        );

        if (blocked.length > 0) {
          const blockedIds = blocked.map((row) => Number(row.id)).join(", ");
          throw new Error(
            `Cannot delete post tags because some tags are still in use: ${blockedIds}`,
          );
        }

        values.deleted = 1;
        values.deleted_at = new Date();
      } else {
        values.deleted = 0;
        values.deleted_at = null;
      }
    }

    if (!Object.keys(values).length) {
      throw new Error("No valid bulk edit fields provided");
    }

    const [affected] = await this.models.PostTag.update(values, {
      where: {
        id: { [Op.in]: ids },
        deleted: patch.deleted === false ? { [Op.in]: [0, 1] } : 0,
      },
    });

    return Number(affected ?? 0);
  }

  async reorderPositions(pairs: ReorderPostTagPositionsInput[]) {
    const safePairs = (pairs || [])
      .map((p) => ({
        id: Number(p.id),
        position: Number(p.position),
      }))
      .filter(
        (p) =>
          Number.isFinite(p.id) &&
          Number.isFinite(p.position) &&
          p.position >= 0,
      );

    if (!safePairs.length) {
      throw new Error("No valid reorder pairs provided");
    }

    const ids = safePairs.map((p) => p.id);

    const whenClauses = safePairs
      .map((p) => `WHEN ${p.id} THEN ${p.position}`)
      .join(" ");

    const sql = `
      UPDATE post_tags
      SET position = CASE id ${whenClauses} END
      WHERE id IN (:ids) AND deleted = 0
    `;

    const result = await this.sequelize.query(sql, {
      replacements: { ids },
      type: QueryTypes.UPDATE,
    });

    if (Array.isArray(result)) {
      const affected = Number(result[1] ?? ids.length);
      return affected;
    }

    return ids.length;
  }
}
