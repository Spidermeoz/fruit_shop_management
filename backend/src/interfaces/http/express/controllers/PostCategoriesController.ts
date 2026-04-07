import { Request, Response, NextFunction } from "express";
import { ListPostCategories } from "../../../../application/post-categories/usecases/ListPostCategories";
import { GetPostCategoryDetail } from "../../../../application/post-categories/usecases/GetPostCategoryDetail";
import { CreatePostCategory } from "../../../../application/post-categories/usecases/CreatePostCategory";
import { EditPostCategory } from "../../../../application/post-categories/usecases/EditPostCategory";
import { ChangePostCategoryStatus } from "../../../../application/post-categories/usecases/ChangePostCategoryStatus";
import { SoftDeletePostCategory } from "../../../../application/post-categories/usecases/SoftDeletePostCategory";
import { BulkEditPostCategories } from "../../../../application/post-categories/usecases/BulkEditPostCategories";
import { ReorderPostCategoryPositions } from "../../../../application/post-categories/usecases/ReorderPostCategoryPositions";
import { GetPostCategorySummary } from "../../../../application/post-categories/usecases/GetPostCategorySummary";
import type { PostCategoryStatus } from "../../../../domain/post-categories/types";
import type { UpdatePostCategoryPatch } from "../../../../domain/post-categories/PostCategoryRepository";

const toNum = (v: any) => (v === undefined ? undefined : Number(v));

const toBool = (v: any) =>
  v === undefined
    ? undefined
    : v === "true" || v === true || v === 1 || v === "1";

const mapCategoryDto = (dto: any) => ({
  id: dto.id,
  title: dto.title,
  parent_id: dto.parentId ?? null,
  parent: dto.parent ?? null,
  children: dto.children ?? [],

  description: dto.description ?? "",
  thumbnail: dto.thumbnail ?? "",
  status: dto.status,
  position: dto.position ?? "",
  slug: dto.slug ?? "",

  seo_title: dto.seoTitle ?? "",
  seo_description: dto.seoDescription ?? "",
  seo_keywords: dto.seoKeywords ?? "",
  og_image: dto.ogImage ?? "",
  canonical_url: dto.canonicalUrl ?? "",

  deleted: dto.deleted ? 1 : 0,
  deleted_at: dto.deletedAt ?? null,
  created_at: dto.createdAt ?? null,
  updated_at: dto.updatedAt ?? null,
});

export const makePostCategoriesController = (uc: {
  list: ListPostCategories;
  detail: GetPostCategoryDetail;
  create: CreatePostCategory;
  edit: EditPostCategory;
  changeStatus: ChangePostCategoryStatus;
  softDelete: SoftDeletePostCategory;
  bulkEdit: BulkEditPostCategories;
  reorder: ReorderPostCategoryPositions;
  summary: GetPostCategorySummary;
}) => {
  return {
    list: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const {
          page,
          limit,
          q,
          keyword,
          parentId,
          parentType,
          status,
          missingThumbnail,
          missingSeo,
          sortBy,
          order,
        } = req.query as Record<string, string>;

        const normalizedPage = Math.max(1, toNum(page) ?? 1);
        const normalizedLimit = Math.max(1, toNum(limit) ?? 10);
        const normalizedQuery = String(q ?? keyword ?? "").trim();

        let normalizedParentId: number | null = null;

        if (parentType === "root") {
          normalizedParentId = 0;
        } else if (parentId !== undefined && String(parentId).trim() !== "") {
          normalizedParentId = Number(parentId);
        }

        const data = await uc.list.execute({
          page: normalizedPage,
          limit: normalizedLimit,
          q: normalizedQuery,
          parentId: normalizedParentId,
          status: (status as any) ?? "all",
          missingThumbnail: toBool(missingThumbnail),
          missingSeo: toBool(missingSeo),
          sortBy: (sortBy as any) ?? "id",
          order: (order as any) ?? "DESC",
        });

        let rows = data.rows;

        if (parentType === "child") {
          rows = rows.filter((row) => row.props.parentId !== null);
        }

        res.json({
          success: true,
          data: rows.map((row) => mapCategoryDto(row.props)),
          meta: {
            total: data.count,
            page: normalizedPage,
            limit: normalizedLimit,
            summary: data.summary,
          },
        });
      } catch (e) {
        next(e);
      }
    },

    summary: async (_req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await uc.summary.execute();

        return res.json({
          success: true,
          data,
        });
      } catch (e) {
        next(e);
      }
    },

    detail: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        const dto = await uc.detail.execute(id);

        return res.json({
          success: true,
          data: mapCategoryDto(dto),
        });
      } catch (e) {
        next(e);
      }
    },

    create: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const payload = req.body as {
          title: string;
          parentId?: number | null;
          description?: string | null;
          thumbnail?: string | null;
          status?: PostCategoryStatus;
          position?: number | null;
          slug?: string | null;

          seoTitle?: string | null;
          seoDescription?: string | null;
          seoKeywords?: string | null;
          ogImage?: string | null;
          canonicalUrl?: string | null;
        };

        const result = await uc.create.execute({
          title: String(payload.title ?? ""),
          parentId:
            payload.parentId !== undefined && payload.parentId !== null
              ? Number(payload.parentId)
              : null,
          description: payload.description ?? null,
          thumbnail: payload.thumbnail ?? null,
          status: payload.status ?? "active",
          position:
            payload.position !== undefined && payload.position !== null
              ? Number(payload.position)
              : null,
          slug: payload.slug ?? null,

          seoTitle: payload.seoTitle ?? null,
          seoDescription: payload.seoDescription ?? null,
          seoKeywords: payload.seoKeywords ?? null,
          ogImage: payload.ogImage ?? null,
          canonicalUrl: payload.canonicalUrl ?? null,
        });

        res.status(201).json({
          success: true,
          data: result,
          meta: { total: 0, page: 1, limit: 10 },
        });
      } catch (e) {
        next(e);
      }
    },

    getEdit: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        const dto = await uc.detail.execute(id);

        return res.json({
          success: true,
          data: mapCategoryDto(dto),
        });
      } catch (e) {
        next(e);
      }
    },

    edit: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);

        const body = req.body as UpdatePostCategoryPatch & {
          parentId?: number | null;
        };

        const payload: UpdatePostCategoryPatch = {
          ...(body.title !== undefined ? { title: body.title } : {}),
          ...(body.parentId !== undefined
            ? {
                parentId: body.parentId !== null ? Number(body.parentId) : null,
              }
            : {}),
          ...(body.description !== undefined
            ? { description: body.description }
            : {}),
          ...(body.thumbnail !== undefined
            ? { thumbnail: body.thumbnail }
            : {}),
          ...(body.status !== undefined ? { status: body.status } : {}),
          ...(body.position !== undefined
            ? {
                position: body.position !== null ? Number(body.position) : null,
              }
            : {}),
          ...(body.slug !== undefined ? { slug: body.slug } : {}),
          ...(body.seoTitle !== undefined ? { seoTitle: body.seoTitle } : {}),
          ...(body.seoDescription !== undefined
            ? { seoDescription: body.seoDescription }
            : {}),
          ...(body.seoKeywords !== undefined
            ? { seoKeywords: body.seoKeywords }
            : {}),
          ...(body.ogImage !== undefined ? { ogImage: body.ogImage } : {}),
          ...(body.canonicalUrl !== undefined
            ? { canonicalUrl: body.canonicalUrl }
            : {}),
          ...(body.deleted !== undefined ? { deleted: !!body.deleted } : {}),
        };

        const updated = await uc.edit.execute(id, payload);

        return res.json({
          success: true,
          data: mapCategoryDto(updated.props),
          meta: { total: 0, page: 1, limit: 10 },
        });
      } catch (e) {
        next(e);
      }
    },

    bulkEdit: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const body = req.body as {
          ids: number[];
          patch: UpdatePostCategoryPatch & { parentId?: number | null };
        };

        const patch = body?.patch ?? {};

        const normalizedPatch: UpdatePostCategoryPatch = {
          ...(patch.title !== undefined ? { title: patch.title } : {}),
          ...(patch.parentId !== undefined
            ? {
                parentId:
                  patch.parentId !== null ? Number(patch.parentId) : null,
              }
            : {}),
          ...(patch.description !== undefined
            ? { description: patch.description }
            : {}),
          ...(patch.thumbnail !== undefined
            ? { thumbnail: patch.thumbnail }
            : {}),
          ...(patch.status !== undefined ? { status: patch.status } : {}),
          ...(patch.position !== undefined
            ? {
                position:
                  patch.position !== null ? Number(patch.position) : null,
              }
            : {}),
          ...(patch.slug !== undefined ? { slug: patch.slug } : {}),
          ...(patch.seoTitle !== undefined ? { seoTitle: patch.seoTitle } : {}),
          ...(patch.seoDescription !== undefined
            ? { seoDescription: patch.seoDescription }
            : {}),
          ...(patch.seoKeywords !== undefined
            ? { seoKeywords: patch.seoKeywords }
            : {}),
          ...(patch.ogImage !== undefined ? { ogImage: patch.ogImage } : {}),
          ...(patch.canonicalUrl !== undefined
            ? { canonicalUrl: patch.canonicalUrl }
            : {}),
          ...(patch.deleted !== undefined ? { deleted: !!patch.deleted } : {}),
        };

        const result = await uc.bulkEdit.execute({
          ids: Array.isArray(body?.ids) ? body.ids.map(Number) : [],
          patch: normalizedPatch,
        });

        return res.json({
          success: true,
          data: result,
        });
      } catch (e) {
        next(e);
      }
    },

    reorder: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const body = req.body as {
          pairs: Array<{ id: number; position: number }>;
        };

        const result = await uc.reorder.execute(
          Array.isArray(body?.pairs)
            ? body.pairs.map((item) => ({
                id: Number(item.id),
                position: Number(item.position),
              }))
            : [],
        );

        return res.json({
          success: true,
          data: result,
        });
      } catch (e) {
        next(e);
      }
    },

    changeStatus: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        const { status } = req.body as { status: PostCategoryStatus };

        const result = await uc.changeStatus.execute(id, status);

        return res.json({
          success: true,
          data: result,
        });
      } catch (e) {
        next(e);
      }
    },

    softDelete: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        const result = await uc.softDelete.execute(id);

        return res.json({
          success: true,
          data: result,
        });
      } catch (e) {
        next(e);
      }
    },
  };
};

export type PostCategoriesController = ReturnType<
  typeof makePostCategoriesController
>;
