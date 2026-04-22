import type {
  ProductTagRepository,
  UpdateProductTagPatch,
} from "../../../domain/products/ProductTagRepository";
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

export class EditProductTag {
  constructor(
    private repo: ProductTagRepository,
    private createAuditLog?: CreateAuditLog,
  ) {}

  async execute(
    id: number,
    patch: UpdateProductTagPatch,
    actor?: ActorContext,
  ) {
    const before =
      typeof this.repo.findById === "function"
        ? await this.repo.findById(id)
        : null;
    const updated = await this.repo.update(id, patch);
    const after =
      typeof this.repo.findById === "function"
        ? await this.repo.findById(id)
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
        moduleName: "product_tag",
        entityType: "product_tag",
        entityId: Number(updated.id ?? id),
        requestId: actor?.requestId ?? null,
        ipAddress: actor?.ipAddress ?? null,
        userAgent: actor?.userAgent ?? null,
        oldValuesJson: toSnapshot(before),
        newValuesJson: toSnapshot(after ?? updated),
        metaJson: { changedFields: Object.keys(patch ?? {}) },
      });
    }

    return { id: updated.id! };
  }
}
