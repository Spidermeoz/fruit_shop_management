import { Request, Response, NextFunction } from "express";
import { ListPosts } from "../../../../../application/posts/usecases/ListPosts";
import { GetPostDetailBySlug } from "../../../../../application/posts/usecases/GetPostDetailBySlug";
import { IncreasePostViewCount } from "../../../../../application/posts/usecases/IncreasePostViewCount";

type PostSortBy =
  | "id"
  | "title"
  | "position"
  | "publishedAt"
  | "createdAt"
  | "updatedAt"
  | "viewCount";

type SortOrder = "ASC" | "DESC";

type PostListRowLike = {
  props?: any;
  id?: number;
};

type PostCategoryRepoLike = {
  findBySlug(slug: string): Promise<{ props?: any; id?: number } | null>;
};

type PostTagRepoLike = {
  findBySlug(slug: string): Promise<{ props?: any; id?: number } | null>;
};

type PostRepoLike = {
  findRelatedPostsByProductId?: (
    productId: number,
    options?: {
      limit?: number;
      excludePostId?: number | null;
    },
  ) => Promise<PostListRowLike[]>;
};

const toNum = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const toBool = (value: unknown): boolean | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  if (value === true || value === "true" || value === 1 || value === "1") {
    return true;
  }
  if (value === false || value === "false" || value === 0 || value === "0") {
    return false;
  }
  return undefined;
};

const normalizeQueryText = (value: unknown) => String(value ?? "").trim();

const isValidSortBy = (value: unknown): value is PostSortBy =>
  value === "id" ||
  value === "title" ||
  value === "position" ||
  value === "publishedAt" ||
  value === "createdAt" ||
  value === "updatedAt" ||
  value === "viewCount";

const isValidOrder = (value: unknown): value is SortOrder =>
  value === "ASC" || value === "DESC";

const toCategoryDto = (category: any) => {
  if (!category || typeof category !== "object") return null;

  return {
    id: Number(category.id),
    title: String(category.title ?? category.name ?? "").trim(),
    slug: category.slug ?? null,
    parent_id:
      category.parentId !== undefined && category.parentId !== null
        ? Number(category.parentId)
        : category.parent_id !== undefined && category.parent_id !== null
          ? Number(category.parent_id)
          : null,
    status: category.status ?? "active",
    position:
      category.position !== undefined && category.position !== null
        ? Number(category.position)
        : null,
  };
};

const toTagDto = (tag: any) => {
  if (!tag || typeof tag !== "object") return null;

  return {
    id: Number(tag.id),
    name: String(tag.name ?? tag.title ?? "").trim(),
    slug: tag.slug ?? null,
    status: tag.status ?? "active",
  };
};

const toRelatedProductDto = (product: any) => {
  if (!product || typeof product !== "object") return null;

  return {
    id: Number(product.id),
    title: String(product.title ?? product.name ?? "").trim(),
    slug: product.slug ?? null,
    thumbnail: product.thumbnail ?? null,
    status: product.status ?? "inactive",
  };
};

const toClientPostDto = (raw: any) => {
  const dto = raw?.props ?? raw ?? {};

  const tags = Array.isArray(dto.tags)
    ? dto.tags.map(toTagDto).filter(Boolean)
    : [];

  const relatedProducts = Array.isArray(dto.relatedProducts)
    ? dto.relatedProducts.map(toRelatedProductDto).filter(Boolean)
    : [];

  return {
    id: Number(dto.id ?? 0),
    post_category_id:
      dto.postCategoryId !== undefined && dto.postCategoryId !== null
        ? Number(dto.postCategoryId)
        : dto.post_category_id !== undefined && dto.post_category_id !== null
          ? Number(dto.post_category_id)
          : null,

    category: toCategoryDto(dto.category),

    title: String(dto.title ?? ""),
    slug: String(dto.slug ?? ""),
    excerpt: dto.excerpt ?? null,
    content: dto.content ?? null,
    thumbnail: dto.thumbnail ?? null,

    status: dto.status ?? "draft",
    featured: Boolean(dto.featured ?? false),
    position:
      dto.position !== undefined && dto.position !== null
        ? Number(dto.position)
        : null,

    published_at:
      dto.publishedAt instanceof Date
        ? dto.publishedAt.toISOString()
        : (dto.publishedAt ?? dto.published_at ?? null),

    seo_title: dto.seoTitle ?? dto.seo_title ?? null,
    seo_description: dto.seoDescription ?? dto.seo_description ?? null,
    seo_keywords: dto.seoKeywords ?? dto.seo_keywords ?? null,
    og_image: dto.ogImage ?? dto.og_image ?? null,
    canonical_url: dto.canonicalUrl ?? dto.canonical_url ?? null,

    view_count:
      dto.viewCount !== undefined && dto.viewCount !== null
        ? Number(dto.viewCount)
        : dto.view_count !== undefined && dto.view_count !== null
          ? Number(dto.view_count)
          : 0,

    tags,
    relatedProducts,

    created_at:
      dto.createdAt instanceof Date
        ? dto.createdAt.toISOString()
        : (dto.createdAt ?? dto.created_at ?? null),

    updated_at:
      dto.updatedAt instanceof Date
        ? dto.updatedAt.toISOString()
        : (dto.updatedAt ?? dto.updated_at ?? null),
  };
};

async function resolveCategoryId(
  categoryValue: string,
  repo: PostCategoryRepoLike,
): Promise<number | undefined> {
  const trimmed = String(categoryValue ?? "").trim();
  if (!trimmed) return undefined;

  const numericId = toNum(trimmed);
  if (numericId && numericId > 0) return numericId;

  const category = await repo.findBySlug(trimmed);
  const resolvedId = Number(category?.props?.id ?? category?.id ?? 0);

  if (!Number.isInteger(resolvedId) || resolvedId <= 0) {
    return undefined;
  }

  return resolvedId;
}

async function resolveTagId(
  tagValue: string,
  repo: PostTagRepoLike,
): Promise<number | undefined> {
  const trimmed = String(tagValue ?? "").trim();
  if (!trimmed) return undefined;

  const numericId = toNum(trimmed);
  if (numericId && numericId > 0) return numericId;

  const tag = await repo.findBySlug(trimmed);
  const resolvedId = Number(tag?.props?.id ?? tag?.id ?? 0);

  if (!Number.isInteger(resolvedId) || resolvedId <= 0) {
    return undefined;
  }

  return resolvedId;
}

export const makeClientPostsController = (uc: {
  list: ListPosts;
  detailBySlug: GetPostDetailBySlug;
  increaseViewCount: IncreasePostViewCount;
  postCategoryRepo: PostCategoryRepoLike;
  postTagRepo: PostTagRepoLike;
  postRepo?: PostRepoLike;
}) => {
  return {
    list: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const {
          page,
          limit,
          q,
          keyword,
          category,
          tag,
          featured,
          sortBy,
          order,
        } = req.query as Record<string, string>;

        const normalizedPage = Math.max(1, toNum(page) ?? 1);
        const normalizedLimit = Math.max(1, toNum(limit) ?? 9);
        const normalizedQuery = normalizeQueryText(q ?? keyword ?? "");
        const normalizedFeatured = toBool(featured);

        const normalizedSortBy: PostSortBy = sortBy
          ? isValidSortBy(sortBy)
            ? sortBy
            : (() => {
                throw new Error("Invalid client post sortBy");
              })()
          : "publishedAt";

        const normalizedOrder: SortOrder = order
          ? isValidOrder(String(order).toUpperCase())
            ? (String(order).toUpperCase() as SortOrder)
            : (() => {
                throw new Error("Invalid client post order");
              })()
          : "DESC";

        const categoryId = category
          ? await resolveCategoryId(category, uc.postCategoryRepo)
          : undefined;

        const tagId = tag ? await resolveTagId(tag, uc.postTagRepo) : undefined;

        const data = await uc.list.execute({
          page: normalizedPage,
          limit: normalizedLimit,
          q: normalizedQuery || undefined,
          categoryId: categoryId ?? null,
          tagId: tagId ?? null,
          featured: normalizedFeatured,
          publishedOnly: true,
          sortBy: normalizedSortBy,
          order: normalizedOrder,
        } as any);

        return res.json({
          success: true,
          data: Array.isArray(data.rows)
            ? data.rows.map((row) => toClientPostDto(row))
            : [],
          meta: {
            total: Number(data.count ?? 0),
            page: normalizedPage,
            limit: normalizedLimit,
            summary: data.summary ?? undefined,
          },
        });
      } catch (e) {
        next(e);
      }
    },

    detail: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const slug = normalizeQueryText(req.params.slug);

        if (!slug) {
          throw new Error("Post slug is required");
        }

        const dto = await uc.detailBySlug.execute(slug);
        const postId = Number(dto?.id ?? 0);

        let nextViewCount =
          dto?.viewCount !== undefined && dto?.viewCount !== null
            ? Number(dto.viewCount)
            : dto?.viewCount !== undefined && dto?.viewCount !== null
              ? Number(dto.viewCount)
              : 0;

        if (Number.isInteger(postId) && postId > 0) {
          const viewResult = await uc.increaseViewCount.execute(postId);
          nextViewCount = Number(viewResult?.viewCount ?? nextViewCount);
        }

        const responseDto = toClientPostDto(dto);

        return res.json({
          success: true,
          data: {
            ...responseDto,
            view_count: nextViewCount,
          },
        });
      } catch (e) {
        next(e);
      }
    },

    relatedByProduct: async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      try {
        const productId = Number(req.params.productId);
        const limit = Math.max(1, toNum(req.query.limit) ?? 3);

        if (!Number.isInteger(productId) || productId <= 0) {
          throw new Error("Product id is invalid");
        }

        if (!uc.postRepo?.findRelatedPostsByProductId) {
          return res.json({
            success: true,
            data: [],
            meta: {
              total: 0,
              limit,
            },
          });
        }

        const rows = await uc.postRepo.findRelatedPostsByProductId(productId, {
          limit,
        });

        return res.json({
          success: true,
          data: Array.isArray(rows)
            ? rows.map((row) => toClientPostDto(row))
            : [],
          meta: {
            total: Array.isArray(rows) ? rows.length : 0,
            limit,
          },
        });
      } catch (e) {
        next(e);
      }
    },
  };
};

export type ClientPostsController = ReturnType<
  typeof makeClientPostsController
>;
