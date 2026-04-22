import type { ProductCategoryRepository } from "../../../domain/categories/ProductCategoryRepository";
import type { CategoryStatus } from "../../../domain/categories/types";
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

export class ChangeCategoryStatus {
  constructor(
    private repo: ProductCategoryRepository,
    private createAuditLog?: CreateAuditLog,
  ) {}

  async execute(id: number, status: CategoryStatus, actor?: ActorContext) {
    const before =
      typeof (this.repo as any).findById === "function"
        ? await (this.repo as any).findById(id)
        : null;

    await this.repo.changeStatus(id, status);

    const after =
      typeof (this.repo as any).findById === "function"
        ? await (this.repo as any).findById(id)
        : null;

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
        action: "change_status",
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
          previousStatus: String(before?.props?.status ?? ""),
        },
        newValuesJson: {
          id: Number(id),
          name: String(after?.props?.name ?? before?.props?.name ?? ""),
          slug: String(after?.props?.slug ?? before?.props?.slug ?? ""),
          nextStatus: String(after?.props?.status ?? status),
        },
        metaJson: {
          parentId:
            after?.props?.parentId !== undefined &&
            after?.props?.parentId !== null
              ? Number(after.props.parentId)
              : before?.props?.parentId !== undefined &&
                  before?.props?.parentId !== null
                ? Number(before.props.parentId)
                : null,
        },
      });
    }

    return { id, status };
  }
}
