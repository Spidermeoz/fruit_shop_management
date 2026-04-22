import type { ProductRepository } from "../../../domain/products/ProductRepository";
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

export class SoftDeleteProduct {
  constructor(
    private repo: ProductRepository,
    private createAuditLog?: CreateAuditLog,
  ) {}

  async execute(id: number, actor?: ActorContext) {
    const before =
      typeof (this.repo as any).findById === "function"
        ? await (this.repo as any).findById(id)
        : null;

    await this.repo.softDelete(id);

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
        action: "soft_delete",
        moduleName: "product",
        entityType: "product",
        entityId: Number(id),
        requestId: actor?.requestId ?? null,
        ipAddress: actor?.ipAddress ?? null,
        userAgent: actor?.userAgent ?? null,
        oldValuesJson: {
          id: Number(id),
          title: String(before?.props?.title ?? ""),
          slug: String(before?.props?.slug ?? ""),
          status: String(before?.props?.status ?? ""),
        },
        newValuesJson: {
          id: Number(id),
          deleted: true,
        },
      });
    }

    return { id };
  }
}
