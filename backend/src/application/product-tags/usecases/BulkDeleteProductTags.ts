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

export class BulkDeleteProductTags {
  constructor(
    private repo: ProductTagRepository,
    private createAuditLog?: CreateAuditLog,
  ) {}

  async execute(ids: number[], actor?: ActorContext) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error("Ids are required");
    }

    const normalizedIds = ids
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0);

    if (normalizedIds.length === 0) {
      throw new Error("Ids are invalid");
    }

    const before = await Promise.all(
      normalizedIds.map(async (id) =>
        typeof this.repo.findById === "function"
          ? await this.repo.findById(id)
          : null,
      ),
    );

    const affected = await this.repo.bulkSoftDelete(normalizedIds);

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
        action: "bulk_soft_delete",
        moduleName: "product_tag",
        entityType: "product_tag",
        entityId: null,
        requestId: actor?.requestId ?? null,
        ipAddress: actor?.ipAddress ?? null,
        userAgent: actor?.userAgent ?? null,
        oldValuesJson: before.map(toSnapshot),
        newValuesJson: { ids: normalizedIds, deleted: true, affected },
        metaJson: { ids: normalizedIds, count: affected },
      });
    }

    return {
      affected,
      ids: normalizedIds,
    };
  }
}
