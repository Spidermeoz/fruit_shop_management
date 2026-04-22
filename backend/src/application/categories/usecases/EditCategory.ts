import type {
  ProductCategoryRepository,
  UpdateCategoryPatch,
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

export class EditCategory {
  constructor(
    private repo: ProductCategoryRepository,
    private createAuditLog?: CreateAuditLog,
  ) {}

  async execute(id: number, patch: UpdateCategoryPatch, actor?: ActorContext) {
    const before =
      typeof (this.repo as any).findById === "function"
        ? await (this.repo as any).findById(id)
        : null;
    const updated = await this.repo.update(id, patch);
    const after =
      typeof (this.repo as any).findById === "function"
        ? await (this.repo as any).findById(id)
        : updated;

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
        action: "update",
        moduleName: "category",
        entityType: "category",
        entityId: Number(id),
        requestId: actor?.requestId ?? null,
        ipAddress: actor?.ipAddress ?? null,
        userAgent: actor?.userAgent ?? null,
        oldValuesJson: {
          id: Number(id),
          name: String(before?.props?.name ?? ""),
          slug: String(before?.props?.slug ?? ""),
          status: String(before?.props?.status ?? ""),
          position:
            before?.props?.position !== undefined &&
            before?.props?.position !== null
              ? Number(before.props.position)
              : null,
          parentId:
            before?.props?.parentId !== undefined &&
            before?.props?.parentId !== null
              ? Number(before.props.parentId)
              : null,
        },
        newValuesJson: {
          id: Number(id),
          name: String(after?.props?.name ?? ""),
          slug: String(after?.props?.slug ?? ""),
          status: String(after?.props?.status ?? ""),
          position:
            after?.props?.position !== undefined &&
            after?.props?.position !== null
              ? Number(after.props.position)
              : null,
          parentId:
            after?.props?.parentId !== undefined &&
            after?.props?.parentId !== null
              ? Number(after.props.parentId)
              : null,
        },
        metaJson: {
          changedFields: Object.keys(patch ?? {}),
        },
      });
    }

    return { id: updated.props.id! };
  }
}
