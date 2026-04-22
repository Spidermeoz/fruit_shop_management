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

export class ChangeBranchDeliverySlotCapacityStatus {
  constructor(
    private readonly repo: BranchDeliverySlotCapacityRepository,
    private readonly createAuditLog?: CreateAuditLog,
  ) {}

  async execute(id: number, status: string, actor?: ActorContext) {
    const capacityId = Number(id);
    const normalizedStatus = String(status ?? "")
      .trim()
      .toLowerCase();

    if (!Number.isInteger(capacityId) || capacityId <= 0) {
      throw new Error("Branch delivery slot capacity id không hợp lệ");
    }

    if (!["active", "inactive"].includes(normalizedStatus)) {
      throw new Error("Status không hợp lệ");
    }

    const existing = await this.repo.findById(capacityId);
    if (!existing) {
      throw new Error("Branch delivery slot capacity not found");
    }

    await this.repo.changeStatus(
      capacityId,
      normalizedStatus as "active" | "inactive",
    );

    const updated = await this.repo.findById(capacityId);
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
        moduleName: "branch_delivery_slot_capacity",
        entityType: "branch_delivery_slot_capacity",
        entityId: Number(capacityId),
        requestId: actor?.requestId ?? null,
        ipAddress: actor?.ipAddress ?? null,
        userAgent: actor?.userAgent ?? null,
        oldValuesJson: toSnapshot(existing) as any,
        newValuesJson: toSnapshot(
          updated ?? { id: capacityId, status: normalizedStatus },
        ) as any,
        metaJson: { status: normalizedStatus } as any,
      });
    }
    return {
      success: true,
      id: capacityId,
      status: normalizedStatus,
    };
  }
}
