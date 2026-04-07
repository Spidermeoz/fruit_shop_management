import type {
  PostCategoryRef,
  PostSeoInput,
  PostStatus,
  PostTagRef,
  RelatedProductRef,
} from "./types";
import { isPostStatus, isValidHttpUrl } from "./types";

export interface PostProps extends PostSeoInput {
  id?: number;
  postCategoryId?: number | null;

  title: string;
  slug?: string | null;
  excerpt?: string | null;
  content?: string | null;
  thumbnail?: string | null;

  status: PostStatus;
  featured?: boolean;
  position?: number | null;
  publishedAt?: Date | null;
  viewCount?: number;

  createdById?: number | null;
  updatedById?: number | null;
  deletedById?: number | null;

  deleted?: boolean;
  deletedAt?: Date | null;

  createdAt?: Date;
  updatedAt?: Date;

  category?: PostCategoryRef | null;
  tags?: PostTagRef[];
  relatedProducts?: RelatedProductRef[];
}

function hasMeaningfulContent(content?: string | null) {
  const text = String(content ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return text.length > 0;
}

function normalizeNullableDate(value?: Date | string | null) {
  if (value === undefined || value === null || value === "") return null;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Post.publishedAt is invalid");
  }

  return date;
}

export class Post {
  private _props: PostProps;

  private constructor(props: PostProps) {
    this._props = Post.validate(props);
  }

  static create(props: PostProps) {
    return new Post(props);
  }

  get props(): Readonly<PostProps> {
    return this._props;
  }

  get id() {
    return this._props.id;
  }

  get title() {
    return this._props.title;
  }

  get slug() {
    return this._props.slug;
  }

  get status() {
    return this._props.status;
  }

  get excerpt() {
    return this._props.excerpt;
  }

  get content() {
    return this._props.content;
  }

  get featured() {
    return this._props.featured;
  }

  get publishedAt() {
    return this._props.publishedAt;
  }

  get category() {
    return this._props.category;
  }

  get tags() {
    return this._props.tags ?? [];
  }

  get relatedProducts() {
    return this._props.relatedProducts ?? [];
  }

  static validate(p: PostProps): PostProps {
    if (!p.title || !String(p.title).trim()) {
      throw new Error("Post.title is required");
    }

    if (!isPostStatus(p.status ?? "draft")) {
      throw new Error("Post.status is invalid");
    }

    if (
      p.position !== undefined &&
      p.position !== null &&
      !Number.isFinite(Number(p.position))
    ) {
      throw new Error("Post.position must be a valid number");
    }

    if (
      p.position !== undefined &&
      p.position !== null &&
      Number(p.position) < 0
    ) {
      throw new Error("Post.position must be greater than or equal to 0");
    }

    if (
      p.viewCount !== undefined &&
      (!Number.isFinite(Number(p.viewCount)) || Number(p.viewCount) < 0)
    ) {
      throw new Error("Post.viewCount must be >= 0");
    }

    const normalizedStatus = p.status ?? "draft";
    const normalizedPublishedAt = normalizeNullableDate(p.publishedAt);

    const normalizedTags = Array.isArray(p.tags)
      ? p.tags
          .map((tag) => ({
            id: Number(tag.id),
            name: String(tag.name ?? "").trim(),
            slug:
              tag.slug !== undefined && tag.slug !== null
                ? String(tag.slug).trim()
                : null,
          }))
          .filter((tag) => Number.isInteger(tag.id) && tag.id > 0 && !!tag.name)
      : [];

    const normalizedRelatedProducts = Array.isArray(p.relatedProducts)
      ? p.relatedProducts
          .map((product, index) => ({
            id: Number(product.id),
            title: String(product.title ?? "").trim(),
            slug: product.slug ?? null,
            thumbnail: product.thumbnail ?? null,
            price:
              product.price !== undefined && product.price !== null
                ? Number(product.price)
                : null,
            position:
              product.position !== undefined && product.position !== null
                ? Number(product.position)
                : index,
          }))
          .filter(
            (product) =>
              Number.isInteger(product.id) && product.id > 0 && !!product.title,
          )
      : [];

    const normalizedCategory =
      p.category && p.category.id
        ? {
            id: Number(p.category.id),
            title: String(p.category.title ?? "").trim(),
            slug: p.category.slug ?? null,
          }
        : null;

    const normalized: PostProps = {
      ...p,
      title: String(p.title).trim(),
      slug: p.slug ? String(p.slug).trim() : null,
      excerpt: p.excerpt != null ? String(p.excerpt).trim() : null,
      content: p.content != null ? String(p.content) : null,
      thumbnail: p.thumbnail != null ? String(p.thumbnail).trim() : null,

      status: normalizedStatus,
      featured: p.featured ?? false,
      position:
        p.position !== undefined && p.position !== null
          ? Number(p.position)
          : null,

      viewCount: Number(p.viewCount ?? 0),

      seoTitle: p.seoTitle != null ? String(p.seoTitle).trim() : null,
      seoDescription:
        p.seoDescription != null ? String(p.seoDescription).trim() : null,
      seoKeywords: p.seoKeywords != null ? String(p.seoKeywords).trim() : null,
      ogImage: p.ogImage != null ? String(p.ogImage).trim() : null,
      canonicalUrl:
        p.canonicalUrl != null ? String(p.canonicalUrl).trim() : null,

      postCategoryId:
        p.postCategoryId !== undefined && p.postCategoryId !== null
          ? Number(p.postCategoryId)
          : null,

      createdById:
        p.createdById !== undefined && p.createdById !== null
          ? Number(p.createdById)
          : null,
      updatedById:
        p.updatedById !== undefined && p.updatedById !== null
          ? Number(p.updatedById)
          : null,
      deletedById:
        p.deletedById !== undefined && p.deletedById !== null
          ? Number(p.deletedById)
          : null,

      deleted: p.deleted ?? false,
      deletedAt: p.deletedAt ?? null,

      publishedAt: normalizedPublishedAt,

      category: normalizedCategory,
      tags: normalizedTags,
      relatedProducts: normalizedRelatedProducts,
    };

    if (normalized.canonicalUrl && !isValidHttpUrl(normalized.canonicalUrl)) {
      throw new Error("Post.canonicalUrl is invalid");
    }

    if (normalized.ogImage && !isValidHttpUrl(normalized.ogImage)) {
      throw new Error("Post.ogImage is invalid");
    }

    if (normalized.status === "published") {
      if (!normalized.slug) {
        throw new Error("Published post must have a valid slug");
      }

      if (!hasMeaningfulContent(normalized.content)) {
        throw new Error("Published post must have content");
      }

      if (!normalized.publishedAt) {
        throw new Error("Published post must have publishedAt");
      }
    }

    return normalized;
  }
}
