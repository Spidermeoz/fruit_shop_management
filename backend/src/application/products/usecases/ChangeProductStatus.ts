import type { ProductRepository } from "../../../domain/products/ProductRepository";
import type { ProductStatus } from "../../../domain/products/types";
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

export class ChangeProductStatus {
  constructor(
    private repo: ProductRepository,
    private createAuditLog?: CreateAuditLog,
  ) {}

  async execute(id: number, status: ProductStatus, actor?: ActorContext) {
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
        moduleName: "product",
        entityType: "product",
        entityId: Number(id),
        requestId: actor?.requestId ?? null,
        ipAddress: actor?.ipAddress ?? null,
        userAgent: actor?.userAgent ?? null,
        oldValuesJson: {
          id: Number(id),
          title: String(before?.props?.title ?? ""),
          previousStatus: String(before?.props?.status ?? ""),
        },
        newValuesJson: {
          id: Number(id),
          title: String(after?.props?.title ?? before?.props?.title ?? ""),
          nextStatus: String(after?.props?.status ?? status),
        },
        metaJson: {
          slug: String(after?.props?.slug ?? before?.props?.slug ?? ""),
        },
      });
    }

    return { id, status };
  }
}
