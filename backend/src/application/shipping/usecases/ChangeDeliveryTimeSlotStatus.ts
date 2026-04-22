import type { DeliveryTimeSlotRepository } from "../../../domain/shipping/DeliveryTimeSlotRepository";

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

type ChangeDeliveryTimeSlotStatusInput = {
  id: number;
  status: string;
};

export class ChangeDeliveryTimeSlotStatus {
  constructor(
    private readonly deliveryTimeSlotRepo: DeliveryTimeSlotRepository,
    private readonly createAuditLog?: CreateAuditLog,
  ) {}

  async execute(
    input: ChangeDeliveryTimeSlotStatusInput,
    actor?: ActorContext,
  ) {
    const id = Number(input.id);
    const status = String(input.status ?? "")
      .trim()
      .toLowerCase();

    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("ID khung giờ giao hàng không hợp lệ.");
    }

    if (!["active", "inactive"].includes(status)) {
      throw new Error("Trạng thái là không hợp lệ.");
    }

    const current = await this.deliveryTimeSlotRepo.findById(id);
    if (!current) {
      throw new Error("Không tìm thấy khung giờ giao hàng.");
    }

    const updated = await this.deliveryTimeSlotRepo.changeStatus(id, status);
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
        moduleName: "delivery_time_slot",
        entityType: "delivery_time_slot",
        entityId: Number(id),
        requestId: actor?.requestId ?? null,
        ipAddress: actor?.ipAddress ?? null,
        userAgent: actor?.userAgent ?? null,
        oldValuesJson: toSnapshot(current) as any,
        newValuesJson: toSnapshot(updated ?? { id, status }) as any,
        metaJson: { status } as any,
      });
    }
    return updated;
  }
}
