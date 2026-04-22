import { BranchDeliverySlotCapacityRepository } from "../../../domain/shipping/BranchDeliverySlotCapacityRepository";

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

export class SoftDeleteBranchDeliverySlotCapacity {
  constructor(
    private readonly repo: BranchDeliverySlotCapacityRepository,
    private readonly createAuditLog?: CreateAuditLog,
  ) {}

  async execute(id: number, actor?: ActorContext) {
    const existing = await this.repo.findById(id);

    if (!existing) {
      throw new Error("Branch delivery slot capacity not found");
    }

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
        moduleName: "branch_delivery_slot_capacity",
        entityType: "branch_delivery_slot_capacity",
        entityId: Number(id),
        requestId: actor?.requestId ?? null,
        ipAddress: actor?.ipAddress ?? null,
        userAgent: actor?.userAgent ?? null,
        oldValuesJson: toSnapshot(existing) as any,
        newValuesJson: { id, deleted: true } as any,
      });
    }

    return {
      success: true,
      message: "Soft delete branch delivery slot capacity thành công.",
    };
  }
}
