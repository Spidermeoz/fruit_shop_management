// src/application/categories/usecases/BulkEditCategories.ts
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

const toBulkCategorySnapshot = (item: any) => ({
  id: Number(item?.props?.id ?? 0) || null,
  name: String(item?.props?.name ?? ""),
  slug: String(item?.props?.slug ?? ""),
  status: String(item?.props?.status ?? ""),
  position:
    item?.props?.position !== undefined && item?.props?.position !== null
      ? Number(item.props.position)
      : null,
  parentId:
    item?.props?.parentId !== undefined && item?.props?.parentId !== null
      ? Number(item.props.parentId)
      : null,
});

export class BulkEditCategories {
  constructor(
    private repo: ProductCategoryRepository,
    private createAuditLog?: CreateAuditLog,
  ) {}

  async execute(
    ids: number[],
    patch: UpdateCategoryPatch,
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
        moduleName: "category",
        entityType: "product_category",
        entityId: null,
        requestId: actor?.requestId ?? null,
        ipAddress: actor?.ipAddress ?? null,
        userAgent: actor?.userAgent ?? null,
        oldValuesJson: before.map((item) => toBulkCategorySnapshot(item)),
        newValuesJson: after.map((item) => toBulkCategorySnapshot(item)),
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
