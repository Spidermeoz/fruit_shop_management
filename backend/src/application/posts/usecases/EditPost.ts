import { Post } from "../../../domain/posts/Post";
import type {
  PostRepository,
  UpdatePostPatch,
} from "../../../domain/posts/PostRepository";
import {
  isPostStatus,
  isValidHttpUrl,
  type PostStatus,
} from "../../../domain/posts/types";
import type { CreateAuditLog } from "../../audit-logs/usecases/CreateAuditLog";

function normalizeIdArray(values?: number[]) {
  if (!Array.isArray(values)) return [];

  return [...new Set(values.map(Number))].filter(
    (id) => Number.isInteger(id) && id > 0,
  );
}

function normalizeNullableText(value?: string | null) {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const normalized = String(value).trim();
  return normalized ? normalized : null;
}

function normalizeNullableNumber(value?: number | string | null) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;

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
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;

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
    postCategoryId?: number | null;
    tagIds?: number[];
    relatedProductIds?: number[];
  },
) {
  if (input.postCategoryId !== undefined && input.postCategoryId !== null) {
    const exists = await repo.existsCategory(input.postCategoryId);
    if (!exists) {
      throw new Error("Post category does not exist");
    }

    const active = await repo.isCategoryUsable(input.postCategoryId);
    if (!active) {
      throw new Error("Post category is not usable");
    }
  }

  if (input.tagIds !== undefined) {
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
  }

  if (input.relatedProductIds !== undefined) {
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
}

function validateBusinessRules(input: {
  title: string;
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

type ActorContext = {
  id?: number | null;
  roleId?: number | null;
  branchIds?: number[];
  requestId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

const pickActorBranchId = (actor?: ActorContext): number | null => {
  if (!Array.isArray(actor?.branchIds)) return null;
  const branchId = actor.branchIds
    .map(Number)
    .find((x) => Number.isFinite(x) && x > 0);
  return branchId ?? null;
};

export class EditPost {
  constructor(
    private repo: PostRepository,
    private createAuditLog?: CreateAuditLog,
  ) {}

  async execute(id: number, patch: UpdatePostPatch, actor?: ActorContext) {
    const before = await this.repo.findById(id);

    if (!before) {
      throw new Error("Post not found");
    }

    const normalizedPatch: UpdatePostPatch = {
      ...(patch.postCategoryId !== undefined
        ? {
            postCategoryId:
              patch.postCategoryId !== null
                ? Number(patch.postCategoryId)
                : null,
          }
        : {}),

      ...(patch.title !== undefined
        ? { title: String(patch.title).trim() }
        : {}),

      ...(patch.excerpt !== undefined
        ? { excerpt: normalizeNullableText(patch.excerpt) }
        : {}),

      ...(patch.content !== undefined
        ? { content: patch.content ?? null }
        : {}),

      ...(patch.thumbnail !== undefined
        ? { thumbnail: normalizeNullableText(patch.thumbnail) }
        : {}),

      ...(patch.status !== undefined ? { status: patch.status } : {}),

      ...(patch.featured !== undefined ? { featured: !!patch.featured } : {}),

      ...(patch.position !== undefined
        ? {
            position: normalizeNullableNumber(patch.position),
          }
        : {}),

      ...(patch.publishedAt !== undefined
        ? { publishedAt: normalizeNullableDate(patch.publishedAt) }
        : {}),

      ...(patch.seoTitle !== undefined
        ? { seoTitle: normalizeNullableText(patch.seoTitle) }
        : {}),

      ...(patch.seoDescription !== undefined
        ? { seoDescription: normalizeNullableText(patch.seoDescription) }
        : {}),

      ...(patch.seoKeywords !== undefined
        ? { seoKeywords: normalizeNullableText(patch.seoKeywords) }
        : {}),

      ...(patch.ogImage !== undefined
        ? { ogImage: normalizeNullableText(patch.ogImage) }
        : {}),

      ...(patch.canonicalUrl !== undefined
        ? { canonicalUrl: normalizeNullableText(patch.canonicalUrl) }
        : {}),

      ...(patch.updatedById !== undefined
        ? {
            updatedById:
              patch.updatedById !== null ? Number(patch.updatedById) : null,
          }
        : {}),

      ...(patch.deletedById !== undefined
        ? {
            deletedById:
              patch.deletedById !== null ? Number(patch.deletedById) : null,
          }
        : {}),

      ...(patch.deleted !== undefined ? { deleted: !!patch.deleted } : {}),

      ...(patch.tagIds !== undefined
        ? { tagIds: normalizeIdArray(patch.tagIds) }
        : {}),

      ...(patch.relatedProductIds !== undefined
        ? {
            relatedProductIds: normalizeIdArray(patch.relatedProductIds),
          }
        : {}),
    };

    await validateRelations(this.repo, {
      postCategoryId: normalizedPatch.postCategoryId,
      tagIds: normalizedPatch.tagIds,
      relatedProductIds: normalizedPatch.relatedProductIds,
    });

    const updatedPost = Post.create({
      ...before.props,
      ...normalizedPatch,
      title:
        normalizedPatch.title !== undefined
          ? normalizedPatch.title
          : before.props.title,
      publishedAt:
        normalizedPatch.publishedAt !== undefined
          ? normalizedPatch.publishedAt instanceof Date
            ? normalizedPatch.publishedAt
            : normalizedPatch.publishedAt
              ? new Date(normalizedPatch.publishedAt)
              : null
          : before.props.publishedAt,
    });

    validateBusinessRules({
      title: updatedPost.props.title,
      content: updatedPost.props.content ?? null,
      status: updatedPost.props.status,
      canonicalUrl: updatedPost.props.canonicalUrl ?? null,
      ogImage: updatedPost.props.ogImage ?? null,
      publishedAt: updatedPost.props.publishedAt ?? null,
    });

    const updatePayload: UpdatePostPatch = {
      postCategoryId: updatedPost.props.postCategoryId ?? null,
      title: updatedPost.props.title,
      excerpt: updatedPost.props.excerpt ?? null,
      content: updatedPost.props.content ?? null,
      thumbnail: updatedPost.props.thumbnail ?? null,

      status: updatedPost.props.status,
      featured: updatedPost.props.featured ?? false,
      position: updatedPost.props.position ?? null,
      publishedAt: updatedPost.props.publishedAt ?? null,

      seoTitle: updatedPost.props.seoTitle ?? null,
      seoDescription: updatedPost.props.seoDescription ?? null,
      seoKeywords: updatedPost.props.seoKeywords ?? null,
      ogImage: updatedPost.props.ogImage ?? null,
      canonicalUrl: updatedPost.props.canonicalUrl ?? null,

      updatedById: updatedPost.props.updatedById ?? null,

      ...(normalizedPatch.deleted !== undefined
        ? { deleted: normalizedPatch.deleted }
        : {}),

      ...(normalizedPatch.deletedById !== undefined
        ? { deletedById: normalizedPatch.deletedById ?? null }
        : {}),

      ...(normalizedPatch.tagIds !== undefined
        ? { tagIds: normalizedPatch.tagIds }
        : {}),

      ...(normalizedPatch.relatedProductIds !== undefined
        ? { relatedProductIds: normalizedPatch.relatedProductIds }
        : {}),
    };

    const after = await this.repo.update(id, updatePayload);

    if (this.createAuditLog) {
      await this.createAuditLog.execute({
        actorUserId:
          actor?.id !== undefined && actor?.id !== null
            ? Number(actor.id)
            : updatePayload.updatedById !== undefined &&
                updatePayload.updatedById !== null
              ? Number(updatePayload.updatedById)
              : null,
        actorRoleId:
          actor?.roleId !== undefined && actor?.roleId !== null
            ? Number(actor.roleId)
            : null,
        branchId: pickActorBranchId(actor),
        action: "update",
        moduleName: "post",
        entityType: "post",
        entityId: Number(id),
        requestId: actor?.requestId ?? null,
        ipAddress: actor?.ipAddress ?? null,
        userAgent: actor?.userAgent ?? null,
        oldValuesJson: before
          ? {
              id: Number(before.props.id),
              title: String(before.props.title ?? ""),
              status: String(before.props.status ?? ""),
            }
          : null,
        newValuesJson: after
          ? {
              id: Number(after.props.id),
              title: String(after.props.title ?? ""),
              status: String(after.props.status ?? ""),
              tagCount: Array.isArray(after.props.tags)
                ? after.props.tags.length
                : 0,
            }
          : null,
      });
    }

    return after;
  }
}
