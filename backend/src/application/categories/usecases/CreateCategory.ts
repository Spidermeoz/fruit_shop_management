import type {
  ProductCategoryRepository,
  CreateCategoryInput,
} from "../../../domain/categories/ProductCategoryRepository";
import type { CreateAuditLog } from "../../audit-logs/usecases/CreateAuditLog";

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

export class CreateCategory {
  constructor(
    private repo: ProductCategoryRepository,
    private createAuditLog?: CreateAuditLog,
  ) {}

  async execute(input: CreateCategoryInput, actor?: ActorContext) {
    if (!input.title?.trim()) throw new Error("Title is required");
    const created = await this.repo.create({
      title: input.title.trim(),
      parentId: input.parentId ?? null,
      description: input.description ?? null,
      thumbnail: input.thumbnail ?? null,
      status: input.status ?? "active",
      position: input.position ?? null,
      slug: input.slug ?? null,
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
        moduleName: "category",
        entityType: "category",
        entityId: Number(created.props.id),
        requestId: actor?.requestId ?? null,
        ipAddress: actor?.ipAddress ?? null,
        userAgent: actor?.userAgent ?? null,
        newValuesJson: {
          id: Number(created.props.id),
          name: String(created.props.title ?? ""),
          status: String(created.props.status ?? ""),
          parentId:
            created.props.parentId !== undefined &&
            created.props.parentId !== null
              ? Number(created.props.parentId)
              : null,
        },
        metaJson: {
          descriptionLength: String(created.props.description ?? "").length,
        },
      });
    }

    return { id: created.props.id! };
  }
}
