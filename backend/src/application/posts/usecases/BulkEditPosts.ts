import type {
  PostRepository,
  UpdatePostPatch,
} from "../../../domain/posts/PostRepository";
import type { PostStatus } from "../../../domain/posts/types";
import type { CreateAuditLog } from "../../audit-logs/usecases/CreateAuditLog";

type BulkEditPostsInput = {
  ids: number[];
  patch: UpdatePostPatch & {
    status?: PostStatus;
  };
};

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

function normalizeIds(values: number[]) {
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

function normalizeIdArray(values?: number[]) {
  if (!Array.isArray(values)) return [];

  return [...new Set(values.map(Number))].filter(
    (id) => Number.isInteger(id) && id > 0,
  );
}

const toSnapshot = (value: any) => value?.props ?? value ?? null;

export class BulkEditPosts {
  constructor(
    private repo: PostRepository,
    private createAuditLog?: CreateAuditLog,
  ) {}

  async execute(input: BulkEditPostsInput, actor?: ActorContext) {
    const ids = normalizeIds(input.ids);

    if (!ids.length) {
      throw new Error("Post ids are required");
    }

    if (typeof this.repo.bulkEdit !== "function") {
      throw new Error("PostRepository.bulkEdit is not implemented");
    }

    const patch = input.patch ?? {};

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

      ...(patch.slug !== undefined
        ? { slug: normalizeNullableText(patch.slug) }
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
            position: patch.position !== null ? Number(patch.position) : null,
          }
        : {}),

      ...(patch.publishedAt !== undefined
        ? { publishedAt: patch.publishedAt ?? null }
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

      ...(patch.deleted !== undefined ? { deleted: !!patch.deleted } : {}),

      ...(patch.deletedById !== undefined
        ? {
            deletedById:
              patch.deletedById !== null ? Number(patch.deletedById) : null,
          }
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

    if (Object.keys(normalizedPatch).length === 0) {
      throw new Error("Bulk edit patch is empty");
    }

    const before = await Promise.all(
      ids.map(async (id) =>
        typeof (this.repo as any).findById === "function"
          ? await (this.repo as any).findById(id)
          : null,
      ),
    );

    const count = await this.repo.bulkEdit(ids, normalizedPatch);

    const after = await Promise.all(
      ids.map(async (id) =>
        typeof (this.repo as any).findById === "function"
          ? await (this.repo as any).findById(id)
          : null,
      ),
    );

    if (this.createAuditLog) {
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
        action: "bulk_update",
        moduleName: "post",
        entityType: "post",
        entityId: null,
        requestId: actor?.requestId ?? null,
        ipAddress: actor?.ipAddress ?? null,
        userAgent: actor?.userAgent ?? null,
        oldValuesJson: before.map(toSnapshot),
        newValuesJson: after.map(toSnapshot),
        metaJson: { ids, count, patch: normalizedPatch },
      });
    }

    return {
      ids,
      count,
      patch: normalizedPatch,
    };
  }
}
