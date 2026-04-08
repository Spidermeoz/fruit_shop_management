import type {
  CreatePostCategoryInput,
  PostCategoryRepository,
} from "../../../domain/post-categories/PostCategoryRepository";

function normalizeNullableText(value?: string | null) {
  if (value === undefined || value === null) return null;

  const normalized = String(value).trim();
  return normalized ? normalized : null;
}

function isValidStatus(value: any): value is "active" | "inactive" {
  return value === "active" || value === "inactive";
}

export class CreatePostCategory {
  constructor(private repo: PostCategoryRepository) {}

  async execute(input: CreatePostCategoryInput) {
    if (!input.title?.trim()) {
      throw new Error("Title is required");
    }

    const normalizedParentId =
      input.parentId !== undefined && input.parentId !== null
        ? Number(input.parentId)
        : null;

    if (
      normalizedParentId !== null &&
      (!Number.isInteger(normalizedParentId) || normalizedParentId <= 0)
    ) {
      throw new Error("Parent category is invalid");
    }

    if (normalizedParentId !== null) {
      const parent = await this.repo.findById(normalizedParentId);
      if (!parent) {
        throw new Error("Parent post category not found");
      }
    }

    const normalizedStatus = input.status ?? "active";
    if (!isValidStatus(normalizedStatus)) {
      throw new Error("Status is invalid");
    }

    const created = await this.repo.create({
      title: input.title.trim(),
      parentId: normalizedParentId,
      description: normalizeNullableText(input.description),
      thumbnail: normalizeNullableText(input.thumbnail),
      status: normalizedStatus,
      position:
        input.position !== undefined && input.position !== null
          ? Number(input.position)
          : null,

      seoTitle: normalizeNullableText(input.seoTitle),
      seoDescription: normalizeNullableText(input.seoDescription),
      seoKeywords: normalizeNullableText(input.seoKeywords),
      ogImage: normalizeNullableText(input.ogImage),
      canonicalUrl: normalizeNullableText(input.canonicalUrl),
    });

    return { id: created.props.id! };
  }
}
