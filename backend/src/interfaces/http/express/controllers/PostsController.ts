import { Request, Response, NextFunction } from "express";
import { ListPosts } from "../../../../application/posts/usecase/ListPosts";
import { GetPostDetail } from "../../../../application/posts/usecase/GetPostDetail";
import { CreatePost } from "../../../../application/posts/usecase/CreatePost";
import { EditPost } from "../../../../application/posts/usecase/EditPost";
import { ChangePostStatus } from "../../../../application/posts/usecase/ChangePostStatus";
import { SoftDeletePost } from "../../../../application/posts/usecase/SoftDeletePost";
import { BulkEditPosts } from "../../../../application/posts/usecase/BulkEditPosts";
import { ReorderPostPositions } from "../../../../application/posts/usecase/ReorderPostPositions";
import { GetPostSummary } from "../../../../application/posts/usecase/GetPostSummary";
import type { PostStatus } from "../../../../domain/posts/types";
import type { UpdatePostPatch } from "../../../../domain/posts/PostRepository";

const toNum = (v: any) => (v === undefined ? undefined : Number(v));

const toBool = (v: any) =>
  v === undefined
    ? undefined
    : v === "true" || v === true || v === 1 || v === "1";

const normalizeIdArray = (values?: number[]) =>
  Array.isArray(values)
    ? [...new Set(values.map(Number))].filter(
        (id) => Number.isInteger(id) && id > 0,
      )
    : [];

const getActorId = (req: Request): number | null => {
  const user = (req as any).user ?? (req as any).authUser ?? null;
  const rawId = user?.id ?? user?.userId ?? user?.adminId ?? user?.sub ?? null;

  const num = Number(rawId);
  return Number.isInteger(num) && num > 0 ? num : null;
};

const toPostDto = (dto: any) => ({
  id: dto.id,
  post_category_id: dto.postCategoryId ?? null,
  category: dto.category ?? null,

  title: dto.title,
  slug: dto.slug ?? "",
  excerpt: dto.excerpt ?? "",
  content: dto.content ?? "",
  thumbnail: dto.thumbnail ?? "",

  status: dto.status,
  featured: !!dto.featured,
  position: dto.position ?? "",
  published_at: dto.publishedAt ?? null,

  seo_title: dto.seoTitle ?? "",
  seo_description: dto.seoDescription ?? "",
  seo_keywords: dto.seoKeywords ?? "",
  og_image: dto.ogImage ?? "",
  canonical_url: dto.canonicalUrl ?? "",

  view_count: dto.viewCount ?? 0,

  tags: dto.tags ?? [],
  tagIds: Array.isArray(dto.tags)
    ? dto.tags
        .map((tag: any) => Number(tag.id))
        .filter((tagId: number) => Number.isInteger(tagId) && tagId > 0)
    : [],

  relatedProducts: dto.relatedProducts ?? [],
  relatedProductIds: Array.isArray(dto.relatedProducts)
    ? dto.relatedProducts
        .map((product: any) => Number(product.id))
        .filter(
          (productId: number) => Number.isInteger(productId) && productId > 0,
        )
    : [],

  created_by_id: dto.createdById ?? null,
  updated_by_id: dto.updatedById ?? null,
  deleted_by_id: dto.deletedById ?? null,
  deleted: dto.deleted ? 1 : 0,
  deleted_at: dto.deletedAt ?? null,
  created_at: dto.createdAt ?? null,
  updated_at: dto.updatedAt ?? null,
});

export const makePostsController = (uc: {
  list: ListPosts;
  detail: GetPostDetail;
  create: CreatePost;
  edit: EditPost;
  changeStatus: ChangePostStatus;
  softDelete: SoftDeletePost;
  bulkEdit: BulkEditPosts;
  reorder: ReorderPostPositions;
  summary: GetPostSummary;
}) => {
  return {
    list: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const {
          page,
          limit,
          q,
          keyword,
          categoryId,
          status,
          featured,
          missingThumbnail,
          missingSeo,
          publishedOnly,
          sortBy,
          order,
        } = req.query as Record<string, string>;

        const normalizedPage = Math.max(1, toNum(page) ?? 1);
        const normalizedLimit = Math.max(1, toNum(limit) ?? 10);
        const normalizedQuery = String(q ?? keyword ?? "").trim();

        const normalizedCategoryId =
          categoryId !== undefined && String(categoryId).trim() !== ""
            ? Number(categoryId)
            : null;

        const data = await uc.list.execute({
          page: normalizedPage,
          limit: normalizedLimit,
          q: normalizedQuery,
          categoryId: normalizedCategoryId,
          status: (status as any) ?? "all",
          featured: toBool(featured),
          missingThumbnail: toBool(missingThumbnail),
          missingSeo: toBool(missingSeo),
          publishedOnly: toBool(publishedOnly),
          sortBy: (sortBy as any) ?? "id",
          order: (order as any) ?? "DESC",
        });

        return res.json({
          success: true,
          data: data.rows,
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

    summary: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const {
          q,
          keyword,
          categoryId,
          status,
          featured,
          missingThumbnail,
          missingSeo,
          publishedOnly,
          sortBy,
          order,
        } = req.query as Record<string, string>;

        const normalizedQuery = String(q ?? keyword ?? "").trim();

        const normalizedCategoryId =
          categoryId !== undefined && String(categoryId).trim() !== ""
            ? Number(categoryId)
            : null;

        const data = await uc.summary.execute({
          q: normalizedQuery,
          categoryId: normalizedCategoryId,
          status: (status as any) ?? "all",
          featured: toBool(featured),
          missingThumbnail: toBool(missingThumbnail),
          missingSeo: toBool(missingSeo),
          publishedOnly: toBool(publishedOnly),
          sortBy: (sortBy as any) ?? "id",
          order: (order as any) ?? "DESC",
        });

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
          data: toPostDto(dto),
        });
      } catch (e) {
        next(e);
      }
    },

    create: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const actorId = getActorId(req);

        const payload = req.body as {
          postCategoryId?: number | null;
          title: string;
          slug?: string | null;
          excerpt?: string | null;
          content?: string | null;
          thumbnail?: string | null;
          status?: PostStatus;
          featured?: boolean;
          position?: number | null;
          publishedAt?: Date | string | null;

          seoTitle?: string | null;
          seoDescription?: string | null;
          seoKeywords?: string | null;
          ogImage?: string | null;
          canonicalUrl?: string | null;

          tagIds?: number[];
          relatedProductIds?: number[];
        };

        const result = await uc.create.execute({
          postCategoryId:
            payload.postCategoryId !== undefined &&
            payload.postCategoryId !== null
              ? Number(payload.postCategoryId)
              : null,
          title: String(payload.title ?? ""),
          slug: payload.slug ?? null,
          excerpt: payload.excerpt ?? null,
          content: payload.content ?? null,
          thumbnail: payload.thumbnail ?? null,
          status: payload.status ?? "draft",
          featured: !!payload.featured,
          position:
            payload.position !== undefined && payload.position !== null
              ? Number(payload.position)
              : null,
          publishedAt: payload.publishedAt ?? null,

          seoTitle: payload.seoTitle ?? null,
          seoDescription: payload.seoDescription ?? null,
          seoKeywords: payload.seoKeywords ?? null,
          ogImage: payload.ogImage ?? null,
          canonicalUrl: payload.canonicalUrl ?? null,

          createdById: actorId,
          updatedById: actorId,

          tagIds: normalizeIdArray(payload.tagIds),
          relatedProductIds: normalizeIdArray(payload.relatedProductIds),
        });

        return res.status(201).json({
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
          data: toPostDto(dto),
        });
      } catch (e) {
        next(e);
      }
    },

    edit: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        const actorId = getActorId(req);

        const body = req.body as UpdatePostPatch & {
          postCategoryId?: number | null;
          tagIds?: number[];
          relatedProductIds?: number[];
        };

        const payload: UpdatePostPatch = {
          ...(body.postCategoryId !== undefined
            ? {
                postCategoryId:
                  body.postCategoryId !== null
                    ? Number(body.postCategoryId)
                    : null,
              }
            : {}),

          ...(body.title !== undefined ? { title: body.title } : {}),
          ...(body.slug !== undefined ? { slug: body.slug } : {}),
          ...(body.excerpt !== undefined ? { excerpt: body.excerpt } : {}),
          ...(body.content !== undefined ? { content: body.content } : {}),
          ...(body.thumbnail !== undefined
            ? { thumbnail: body.thumbnail }
            : {}),

          ...(body.status !== undefined ? { status: body.status } : {}),
          ...(body.featured !== undefined ? { featured: !!body.featured } : {}),
          ...(body.position !== undefined
            ? {
                position: body.position !== null ? Number(body.position) : null,
              }
            : {}),
          ...(body.publishedAt !== undefined
            ? { publishedAt: body.publishedAt }
            : {}),

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

          updatedById: actorId,

          ...(body.deleted !== undefined ? { deleted: !!body.deleted } : {}),

          ...(body.tagIds !== undefined
            ? { tagIds: normalizeIdArray(body.tagIds) }
            : {}),

          ...(body.relatedProductIds !== undefined
            ? {
                relatedProductIds: normalizeIdArray(body.relatedProductIds),
              }
            : {}),
        };

        const updated = await uc.edit.execute(id, payload);

        return res.json({
          success: true,
          data: updated.props,
          meta: { total: 0, page: 1, limit: 10 },
        });
      } catch (e) {
        next(e);
      }
    },

    changeStatus: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        const { status } = req.body as { status: PostStatus };

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
        const actorId = getActorId(req);

        const result = await uc.softDelete.execute(id, actorId);

        return res.json({
          success: true,
          data: result,
        });
      } catch (e) {
        next(e);
      }
    },

    bulkEdit: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const actorId = getActorId(req);

        const body = req.body as {
          ids: number[];
          patch: UpdatePostPatch & {
            postCategoryId?: number | null;
            tagIds?: number[];
            relatedProductIds?: number[];
          };
        };

        const patch = body.patch ?? {};

        const payload: UpdatePostPatch = {
          ...(patch.postCategoryId !== undefined
            ? {
                postCategoryId:
                  patch.postCategoryId !== null
                    ? Number(patch.postCategoryId)
                    : null,
              }
            : {}),

          ...(patch.title !== undefined ? { title: patch.title } : {}),
          ...(patch.slug !== undefined ? { slug: patch.slug } : {}),
          ...(patch.excerpt !== undefined ? { excerpt: patch.excerpt } : {}),
          ...(patch.content !== undefined ? { content: patch.content } : {}),
          ...(patch.thumbnail !== undefined
            ? { thumbnail: patch.thumbnail }
            : {}),

          ...(patch.status !== undefined ? { status: patch.status } : {}),
          ...(patch.featured !== undefined
            ? { featured: !!patch.featured }
            : {}),
          ...(patch.position !== undefined
            ? {
                position:
                  patch.position !== null ? Number(patch.position) : null,
              }
            : {}),
          ...(patch.publishedAt !== undefined
            ? { publishedAt: patch.publishedAt }
            : {}),

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

          updatedById: actorId,

          ...(patch.deleted !== undefined ? { deleted: !!patch.deleted } : {}),
          ...(patch.deletedById !== undefined
            ? { deletedById: patch.deletedById }
            : {}),

          ...(patch.tagIds !== undefined
            ? { tagIds: normalizeIdArray(patch.tagIds) }
            : {}),

          ...(patch.relatedProductIds !== undefined
            ? {
                relatedProductIds: normalizeIdArray(patch.relatedProductIds),
              }
            : {}),
        };

        const result = await uc.bulkEdit.execute({
          ids: normalizeIdArray(body.ids),
          patch: payload,
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
        const actorId = getActorId(req);

        const body = req.body as {
          pairs: { id: number; position: number }[];
        };

        const result = await uc.reorder.execute(body.pairs ?? [], actorId);

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

export type PostsController = ReturnType<typeof makePostsController>;
