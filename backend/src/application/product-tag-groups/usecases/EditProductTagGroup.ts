import type {
  ProductTagGroupRepository,
  UpdateProductTagGroupPatch,
} from "../../../domain/products/ProductTagGroupRepository";
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

export class EditProductTagGroup {
  constructor(
    private repo: ProductTagGroupRepository,
    private createAuditLog?: CreateAuditLog,
  ) {}

  async execute(
    id: number,
    patch: UpdateProductTagGroupPatch,
    actor?: ActorContext,
  ) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("Invalid product tag group id");
    }

    const nextPatch: UpdateProductTagGroupPatch = {};

    if (patch.name !== undefined) {
      const name = patch.name.trim();
      if (!name) throw new Error("Name is required");
      nextPatch.name = name;
    }

    if (patch.slug !== undefined) {
      nextPatch.slug = patch.slug?.trim() || null;
    }

    if (patch.deleted !== undefined) {
      nextPatch.deleted = !!patch.deleted;
    }

    const before =
      typeof (this.repo as any).findById === "function"
        ? await (this.repo as any).findById(id)
        : null;

    const updated = await this.repo.update(id, nextPatch);

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
        moduleName: "product_tag_group",
        entityType: "product_tag_group",
        entityId: Number(updated.id ?? id),
        requestId: actor?.requestId ?? null,
        ipAddress: actor?.ipAddress ?? null,
        userAgent: actor?.userAgent ?? null,
        oldValuesJson: toSnapshot(before),
        newValuesJson: toSnapshot(after ?? updated),
        metaJson: { changedFields: Object.keys(nextPatch ?? {}) },
      });
    }

    return { id: updated.id! };
  }
}
