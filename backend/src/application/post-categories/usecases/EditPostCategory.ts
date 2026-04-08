import { PostCategory } from "../../../domain/post-categories/PostCategory";
import type {
  PostCategoryRepository,
  UpdatePostCategoryPatch,
} from "../../../domain/post-categories/PostCategoryRepository";

function normalizeNullableText(value?: string | null) {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const normalized = String(value).trim();
  return normalized ? normalized : null;
}

function isValidStatus(value: any): value is "active" | "inactive" {
  return value === "active" || value === "inactive";
}

export class EditPostCategory {
  constructor(private repo: PostCategoryRepository) {}

  private async ensureNoCycle(currentId: number, nextParentId: number | null) {
    if (nextParentId === null) return;

    let cursor: number | null = nextParentId;
    const visited = new Set<number>();

    while (cursor !== null) {
      if (visited.has(cursor)) {
        throw new Error("Invalid category hierarchy");
      }
      visited.add(cursor);

      if (Number(cursor) === Number(currentId)) {
        throw new Error("A category cannot be moved inside its own descendant");
      }

      const node = await this.repo.findById(cursor);
      if (!node) {
        throw new Error("Parent post category not found");
      }

      cursor = node.props.parentId ?? null;
    }
  }

  async execute(id: number, patch: UpdatePostCategoryPatch) {
    const existingCategory = await this.repo.findById(id);

    if (!existingCategory) {
      throw new Error("Post category not found");
    }

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

    if (
      normalizedPatch.parentId !== undefined &&
      normalizedPatch.parentId !== null
    ) {
      if (
        !Number.isInteger(Number(normalizedPatch.parentId)) ||
        Number(normalizedPatch.parentId) <= 0
      ) {
        throw new Error("Parent category is invalid");
      }

      if (Number(normalizedPatch.parentId) === Number(id)) {
        throw new Error("A category cannot be its own parent");
      }

      const parent = await this.repo.findById(Number(normalizedPatch.parentId));
      if (!parent) {
        throw new Error("Parent post category not found");
      }

      await this.ensureNoCycle(id, Number(normalizedPatch.parentId));
    }

    const updatedCategory = PostCategory.create({
      ...existingCategory.props,
      ...normalizedPatch,
      title:
        normalizedPatch.title !== undefined
          ? normalizedPatch.title
          : existingCategory.props.title,
    });

    if (
      updatedCategory.props.parentId !== null &&
      updatedCategory.props.parentId !== undefined &&
      Number(updatedCategory.props.parentId) === Number(id)
    ) {
      throw new Error("A category cannot be its own parent");
    }

    const updatePayload: UpdatePostCategoryPatch = {
      title: updatedCategory.props.title,
      parentId: updatedCategory.props.parentId ?? null,
      description: updatedCategory.props.description ?? null,
      thumbnail: updatedCategory.props.thumbnail ?? null,
      status: updatedCategory.props.status,
      position: updatedCategory.props.position ?? null,

      seoTitle: updatedCategory.props.seoTitle ?? null,
      seoDescription: updatedCategory.props.seoDescription ?? null,
      seoKeywords: updatedCategory.props.seoKeywords ?? null,
      ogImage: updatedCategory.props.ogImage ?? null,
      canonicalUrl: updatedCategory.props.canonicalUrl ?? null,

      ...(normalizedPatch.deleted !== undefined
        ? { deleted: normalizedPatch.deleted }
        : {}),
    };

    return this.repo.update(id, updatePayload);
  }
}
