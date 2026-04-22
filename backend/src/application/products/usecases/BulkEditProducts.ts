// src/application/products/usecases/BulkEditProducts.ts
import type {
  ProductRepository,
  UpdateProductPatch,
} from "../../../domain/products/ProductRepository";
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

const toBulkProductSnapshot = (item: any) => ({
  id: Number(item?.props?.id ?? 0) || null,
  title: String(item?.props?.title ?? ""),
  slug: String(item?.props?.slug ?? ""),
  status: String(item?.props?.status ?? ""),
  featured: Boolean(item?.props?.featured),
  price:
    item?.props?.price !== undefined && item?.props?.price !== null
      ? Number(item.props.price)
      : null,
  position:
    item?.props?.position !== undefined && item?.props?.position !== null
      ? Number(item.props.position)
      : null,
});

export class BulkEditProducts {
  constructor(
    private repo: ProductRepository,
    private createAuditLog?: CreateAuditLog,
  ) {}

  async execute(
    ids: number[],
    patch: UpdateProductPatch,
    actor?: ActorContext,
  ) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error("ids must be a non-empty array");
    }

    const before = await Promise.all(
      ids.map(async (id) =>
        typeof (this.repo as any).findById === "function"
          ? await (this.repo as any).findById(id)
          : null,
      ),
    );

    const affected = await this.repo.bulkEdit(ids, patch);

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
        moduleName: "product",
        entityType: "product",
        entityId: null,
        requestId: actor?.requestId ?? null,
        ipAddress: actor?.ipAddress ?? null,
        userAgent: actor?.userAgent ?? null,
        oldValuesJson: before.map((item) => toBulkProductSnapshot(item)),
        newValuesJson: after.map((item) => toBulkProductSnapshot(item)),
        metaJson: {
          ids,
          affected,
          changedFields: Object.keys(patch ?? {}),
        },
      });
    }

    return { affected };
  }
}
