import type {
  CreatePostInput,
  PostRepository,
} from "../../../domain/posts/PostRepository";
import {
  isPostStatus,
  isValidHttpUrl,
  type PostStatus,
} from "../../../domain/posts/types";

function normalizeIdArray(values?: number[]) {
  if (!Array.isArray(values)) return [];

  return [...new Set(values.map(Number))].filter(
    (id) => Number.isInteger(id) && id > 0,
  );
}

function normalizeNullableText(value?: string | null) {
  if (value === undefined || value === null) return null;

  const normalized = String(value).trim();
  return normalized ? normalized : null;
}

function normalizeRequiredText(value?: string | null) {
  return String(value ?? "").trim();
}

function normalizeStatus(status?: PostStatus): PostStatus {
  return status ?? "draft";
}

function normalizeNullableNumber(value?: number | string | null) {
  if (value === undefined || value === null || value === "") return null;

  const num = Number(value);
  if (!Number.isFinite(num)) {
    throw new Error("Position must be a valid number");
  }
  if (num < 0) {
    throw new Error("Position must be greater than or equal to 0");
  }

  return num;
}

function normalizeNullableDate(value?: Date | string | null) {
  if (value === undefined || value === null || value === "") return null;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Published date is invalid");
  }

  return date;
}

function hasMeaningfulContent(content?: string | null) {
  const text = String(content ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return text.length > 0;
}

async function validateRelations(
  repo: PostRepository,
  input: {
    postCategoryId: number | null;
    tagIds: number[];
    relatedProductIds: number[];
  },
) {
  if (input.postCategoryId !== null) {
    const exists = await repo.existsCategory(input.postCategoryId);
    if (!exists) {
      throw new Error("Post category does not exist");
    }

    const active = await repo.isCategoryUsable(input.postCategoryId);
    if (!active) {
      throw new Error("Post category is not usable");
    }
  }

  if (input.tagIds.length > 0) {
    const existingTagIds = await repo.findExistingTagIds(input.tagIds);
    if (existingTagIds.length !== input.tagIds.length) {
      throw new Error("One or more post tags do not exist");
    }

    const usableTagIds = await repo.findUsableTagIds(input.tagIds);
    if (usableTagIds.length !== input.tagIds.length) {
      throw new Error("One or more post tags are not usable");
    }
  }

  if (input.relatedProductIds.length > 0) {
    const existingProductIds = await repo.findExistingRelatedProductIds(
      input.relatedProductIds,
    );
    if (existingProductIds.length !== input.relatedProductIds.length) {
      throw new Error("One or more related products do not exist");
    }

    const usableProductIds = await repo.findUsableRelatedProductIds(
      input.relatedProductIds,
    );
    if (usableProductIds.length !== input.relatedProductIds.length) {
      throw new Error("One or more related products are not usable");
    }
  }
}

function validateBusinessRules(input: {
  title: string;
  slug: string | null;
  content: string | null;
  status: PostStatus;
  canonicalUrl: string | null;
  ogImage: string | null;
  publishedAt: Date | null;
}) {
  if (!input.title) {
    throw new Error("Title is required");
  }

  if (!isPostStatus(input.status)) {
    throw new Error("Post status is invalid");
  }

  if (input.canonicalUrl && !isValidHttpUrl(input.canonicalUrl)) {
    throw new Error("Canonical URL is invalid");
  }

  if (input.ogImage && !isValidHttpUrl(input.ogImage)) {
    throw new Error("OG image URL is invalid");
  }
}

export class CreatePost {
  constructor(private repo: PostRepository) {}

  async execute(input: CreatePostInput) {
    const normalizedTagIds = normalizeIdArray(input.tagIds);
    const normalizedRelatedProductIds = normalizeIdArray(
      input.relatedProductIds,
    );

    const normalizedStatus = normalizeStatus(input.status);
    const normalizedTitle = normalizeRequiredText(input.title);
    const normalizedExcerpt = normalizeNullableText(input.excerpt);
    const normalizedContent =
      input.content !== undefined && input.content !== null
        ? String(input.content)
        : null;
    const normalizedThumbnail = normalizeNullableText(input.thumbnail);
    const normalizedPublishedAt = normalizeNullableDate(input.publishedAt);

    const normalizedPayload: CreatePostInput = {
      postCategoryId:
        input.postCategoryId !== undefined && input.postCategoryId !== null
          ? Number(input.postCategoryId)
          : null,

      title: normalizedTitle,
      excerpt: normalizedExcerpt,
      content: normalizedContent,
      thumbnail: normalizedThumbnail,

      status: normalizedStatus,
      featured: !!input.featured,
      position: normalizeNullableNumber(input.position),
      publishedAt: normalizedPublishedAt,

      seoTitle: normalizeNullableText(input.seoTitle),
      seoDescription: normalizeNullableText(input.seoDescription),
      seoKeywords: normalizeNullableText(input.seoKeywords),
      ogImage: normalizeNullableText(input.ogImage),
      canonicalUrl: normalizeNullableText(input.canonicalUrl),

      createdById:
        input.createdById !== undefined && input.createdById !== null
          ? Number(input.createdById)
          : null,
      updatedById:
        input.updatedById !== undefined && input.updatedById !== null
          ? Number(input.updatedById)
          : null,

      tagIds: normalizedTagIds,
      relatedProductIds: normalizedRelatedProductIds,
    };

    validateBusinessRules({
      title: normalizedPayload.title,
      slug: normalizedPayload.slug ?? null,
      content: normalizedPayload.content ?? null,
      status: normalizedPayload.status ?? "draft",
      canonicalUrl: normalizedPayload.canonicalUrl ?? null,
      ogImage: normalizedPayload.ogImage ?? null,
      publishedAt:
        normalizedPayload.publishedAt instanceof Date
          ? normalizedPayload.publishedAt
          : normalizedPayload.publishedAt
            ? new Date(normalizedPayload.publishedAt)
            : null,
    });

    await validateRelations(this.repo, {
      postCategoryId: normalizedPayload.postCategoryId ?? null,
      tagIds: normalizedPayload.tagIds ?? [],
      relatedProductIds: normalizedPayload.relatedProductIds ?? [],
    });

    return this.repo.create(normalizedPayload);
  }
}
