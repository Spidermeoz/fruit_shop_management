import type {
  OriginRepository,
  UpdateOriginPatch,
} from "../../../domain/products/OriginRepository";
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
const toSnapshot = (value: any) => value?.props ?? value ?? null;

export class EditOrigin {
  constructor(
    private repo: OriginRepository,
    private createAuditLog?: CreateAuditLog,
  ) {}

  async execute(id: number, patch: UpdateOriginPatch, actor?: ActorContext) {
    const before = await this.repo.findById(id);

    const updated = await this.repo.update(id, patch);
    const after = await this.repo.findById(id);

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
        moduleName: "origin",
        entityType: "origin",
        entityId: Number(updated.id ?? id),
        requestId: actor?.requestId ?? null,
        ipAddress: actor?.ipAddress ?? null,
        userAgent: actor?.userAgent ?? null,
        oldValuesJson: {
          id: Number(id),
          name: String(before?.name ?? ""),
          status: String(before?.status ?? ""),
        },
        newValuesJson: {
          id: Number(id),
          name: String(after?.name ?? ""),
          status: String(after?.status ?? ""),
        },
        metaJson: {
          changedFields: Object.keys(patch ?? {}),
        },
      });
    }

    return { id: updated.id! };
  }
}
