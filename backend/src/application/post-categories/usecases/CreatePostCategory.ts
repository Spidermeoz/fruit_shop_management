import type {
  CreatePostCategoryInput,
  PostCategoryRepository,
} from "../../../domain/post-categories/PostCategoryRepository";
import type { CreateAuditLog } from "../../audit-logs/usecases/CreateAuditLog";

function normalizeNullableText(value?: string | null) {
  if (value === undefined || value === null) return null;

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

export class CreatePostCategory {
  constructor(
    private repo: PostCategoryRepository,
    private createAuditLog?: CreateAuditLog,
  ) {}

  async execute(input: CreatePostCategoryInput, actor?: ActorContext) {
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
        action: "create",
        moduleName: "post_category",
        entityType: "post_category",
        entityId: Number(created?.props?.id ?? 0) || null,
        requestId: actor?.requestId ?? null,
        ipAddress: actor?.ipAddress ?? null,
        userAgent: actor?.userAgent ?? null,
        newValuesJson: {
          id: Number(created?.props?.id ?? 0),
          name: String(created?.props?.title ?? ""),
          slug: String(created?.props?.slug ?? ""),
          status: String(created?.props?.status ?? ""),
        },
        metaJson: {
          descriptionLength: String(created?.props?.description ?? "").length,
        },
      });
    }

    return { id: created.props.id! };
  }
}
