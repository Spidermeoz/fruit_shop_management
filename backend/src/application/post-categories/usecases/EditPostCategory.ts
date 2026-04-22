import { PostCategory } from "../../../domain/post-categories/PostCategory";
import type {
  PostCategoryRepository,
  UpdatePostCategoryPatch,
} from "../../../domain/post-categories/PostCategoryRepository";
import type { CreateAuditLog } from "../../audit-logs/usecases/CreateAuditLog";

function normalizeNullableText(value?: string | null) {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const normalized = String(value).trim();
  return normalized ? normalized : null;
}

function isValidStatus(value: any): value is "active" | "inactive" {
  return value === "active" || value === "inactive";
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
const toSnapshot = (value: any) => value?.props ?? value ?? null;

export class EditPostCategory {
  constructor(
    private repo: PostCategoryRepository,
    private createAuditLog?: CreateAuditLog,
  ) {}

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

  async execute(
    id: number,
    patch: UpdatePostCategoryPatch,
    actor?: ActorContext,
  ) {
    const existingCategory = await this.repo.findById(id);

    if (!existingCategory) {
      throw new Error("Post category not found");
    }

    const before = await this.repo.findById(id);

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

    const saved = await this.repo.update(id, updatePayload);
    const after = await this.repo.findById(id);

    if (this.createAuditLog) {
      const fresh = await this.repo.findById(id);
      await this.createAuditLog.execute({
        actorUserId:
          actor?.id !== undefined && actor?.id !== null
            ? Number(actor.id)
            : null,
        actorRoleId:
          actor?.roleId !== undefined && actor?.roleId !== null
            ? Number(actor.roleId)
            : null,
        branchId: pickActorBranchId(actor),
        action: "update",
        moduleName: "post_category",
        entityType: "post_category",
        entityId: Number(id),
        requestId: actor?.requestId ?? null,
        ipAddress: actor?.ipAddress ?? null,
        userAgent: actor?.userAgent ?? null,
        oldValuesJson: {
          id: Number(id),
          name: String(before?.props?.title ?? ""),
          slug: String(before?.props?.slug ?? ""),
          status: String(before?.props?.status ?? ""),
        },
        newValuesJson: {
          id: Number(id),
          name: String(after?.props?.title ?? ""),
          slug: String(after?.props?.slug ?? ""),
          status: String(after?.props?.status ?? ""),
        },
        metaJson: {
          changedFields: Object.keys(patch ?? {}),
        },
      });
    }

    return saved;
  }
}
