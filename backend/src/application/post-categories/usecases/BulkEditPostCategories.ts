import type {
  PostCategoryRepository,
  UpdatePostCategoryPatch,
} from "../../../domain/post-categories/PostCategoryRepository";
import type { PostCategoryStatus } from "../../../domain/post-categories/types";
import { PostCategoryTreeGuard } from "../services/PostCategoryTreeGuard";

type BulkEditInput = {
  ids: number[];
  patch: UpdatePostCategoryPatch;
};

function normalizeNullableText(value?: string | null) {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const normalized = String(value).trim();
  return normalized ? normalized : null;
}

function isValidStatus(value: any): value is PostCategoryStatus {
  return value === "active" || value === "inactive";
}

export class BulkEditPostCategories {
  constructor(private repo: PostCategoryRepository) {}

  async execute(input: BulkEditInput) {
    const ids = Array.isArray(input.ids)
      ? Array.from(
          new Set(
            input.ids
              .map((id) => Number(id))
              .filter((id) => Number.isInteger(id) && id > 0),
          ),
        )
      : [];

    if (!ids.length) {
      throw new Error("At least one category id is required");
    }

    const patch = input.patch ?? {};

    const normalizedPatch: UpdatePostCategoryPatch = {
      ...(patch.title !== undefined
        ? { title: String(patch.title).trim() }
        : {}),

      ...(patch.parentId !== undefined
        ? {
            parentId: patch.parentId !== null ? Number(patch.parentId) : null,
          }
        : {}),

      ...(patch.description !== undefined
        ? { description: normalizeNullableText(patch.description) }
        : {}),

      ...(patch.thumbnail !== undefined
        ? { thumbnail: normalizeNullableText(patch.thumbnail) }
        : {}),

      ...(patch.status !== undefined ? { status: patch.status } : {}),

      ...(patch.position !== undefined
        ? {
            position: patch.position !== null ? Number(patch.position) : null,
          }
        : {}),

      ...(patch.slug !== undefined
        ? { slug: normalizeNullableText(patch.slug) }
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

      ...(patch.deleted !== undefined ? { deleted: !!patch.deleted } : {}),
    };

    if (
      normalizedPatch.title !== undefined &&
      !String(normalizedPatch.title).trim()
    ) {
      throw new Error("Title is required");
    }

    if (
      normalizedPatch.status !== undefined &&
      !isValidStatus(normalizedPatch.status)
    ) {
      throw new Error("Status is invalid");
    }

    const treeGuard = new PostCategoryTreeGuard(this.repo);

    if (normalizedPatch.parentId !== undefined) {
      if (
        normalizedPatch.parentId !== null &&
        (!Number.isInteger(Number(normalizedPatch.parentId)) ||
          Number(normalizedPatch.parentId) <= 0)
      ) {
        throw new Error("Parent category is invalid");
      }

      if (normalizedPatch.parentId !== null) {
        const parent = await this.repo.findById(
          Number(normalizedPatch.parentId),
        );
        if (!parent) {
          throw new Error("Parent post category not found");
        }
      }
    }

    const updated = [];

    for (const id of ids) {
      const existing = await this.repo.findById(id);
      if (!existing) {
        throw new Error(`Post category not found: ${id}`);
      }

      if (normalizedPatch.parentId !== undefined) {
        await treeGuard.ensureValidParentAssignment(
          id,
          normalizedPatch.parentId ?? null,
        );
      }

      const row = await this.repo.update(id, normalizedPatch);
      updated.push(row);
    }

    return {
      ids,
      count: updated.length,
      rows: updated.map((row) => row.props),
    };
  }
}
