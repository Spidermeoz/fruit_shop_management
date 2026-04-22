import type { ProductTagRepository } from "../../../domain/products/ProductTagRepository";
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

const toSnapshot = (value: any) => value ?? null;

export class DeleteProductTag {
  constructor(
    private repo: ProductTagRepository,
    private createAuditLog?: CreateAuditLog,
  ) {}

  async execute(id: number, actor?: ActorContext) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new Error("Product tag not found");

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
        moduleName: "product_tag",
        entityType: "product_tag",
        entityId: Number(id),
        requestId: actor?.requestId ?? null,
        ipAddress: actor?.ipAddress ?? null,
        userAgent: actor?.userAgent ?? null,
        oldValuesJson: toSnapshot(existing),
        newValuesJson: { id, deleted: true },
      });
    }

    return { id };
  }
}
