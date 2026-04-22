import type { BranchRepository } from "../../../domain/branches/BranchRepository";
import type { BranchDeliveryTimeSlotRepository } from "../../../domain/shipping/BranchDeliveryTimeSlotRepository";
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

type EditBranchDeliveryTimeSlotInput = {
  id: number;
  branchId: number;
  deliveryTimeSlotId: number;
  maxOrdersOverride?: number | null;
  status?: string;
};

export class EditBranchDeliveryTimeSlot {
  constructor(
    private readonly branchDeliveryTimeSlotRepo: BranchDeliveryTimeSlotRepository,
    private readonly branchRepo: BranchRepository,
    private readonly deliveryTimeSlotRepo: DeliveryTimeSlotRepository,
    private readonly createAuditLog?: CreateAuditLog,
  ) {}

  async execute(input: EditBranchDeliveryTimeSlotInput, actor?: ActorContext) {
    const id = Number(input.id);
    const branchId = Number(input.branchId);
    const deliveryTimeSlotId = Number(input.deliveryTimeSlotId);
    const status =
      String(input.status ?? "active")
        .trim()
        .toLowerCase() || "active";

    let maxOrdersOverride: number | null = null;
    if (
      input.maxOrdersOverride !== undefined &&
      input.maxOrdersOverride !== null
    ) {
      maxOrdersOverride = Number(input.maxOrdersOverride);
    }

    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("ID branch delivery time slot không hợp lệ.");
    }

    if (!Number.isInteger(branchId) || branchId <= 0) {
      throw new Error("Chi nhánh không hợp lệ.");
    }

    if (!Number.isInteger(deliveryTimeSlotId) || deliveryTimeSlotId <= 0) {
      throw new Error("Khung giờ giao hàng không hợp lệ.");
    }

    if (!["active", "inactive"].includes(status)) {
      throw new Error("Trạng thái cấu hình không hợp lệ.");
    }

    if (
      maxOrdersOverride !== null &&
      (!Number.isInteger(maxOrdersOverride) || maxOrdersOverride < 0)
    ) {
      throw new Error("Max orders override phải là số nguyên >= 0.");
    }

    const current = await this.branchDeliveryTimeSlotRepo.findById(id);
    if (!current) {
      throw new Error(
        "Không tìm thấy cấu hình khung giờ giao hàng theo chi nhánh.",
      );
    }

    const branch = await this.branchRepo.findById(branchId);
    if (!branch) {
      throw new Error("Không tìm thấy chi nhánh.");
    }

    const deliveryTimeSlot =
      await this.deliveryTimeSlotRepo.findById(deliveryTimeSlotId);
    if (!deliveryTimeSlot) {
      throw new Error("Không tìm thấy khung giờ giao hàng.");
    }

    const existing = await this.branchDeliveryTimeSlotRepo.findByBranchAndSlot(
      branchId,
      deliveryTimeSlotId,
    );

    if (existing && existing.id !== id) {
      throw new Error("Khung giờ này đã được gán cho chi nhánh.");
    }

    const updated = await this.branchDeliveryTimeSlotRepo.update(id, {
      branchId,
      deliveryTimeSlotId,
      maxOrdersOverride,
      status,
    });
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
        moduleName: "branch_delivery_time_slot",
        entityType: "branch_delivery_time_slot",
        entityId: Number(id),
        requestId: actor?.requestId ?? null,
        ipAddress: actor?.ipAddress ?? null,
        userAgent: actor?.userAgent ?? null,
        oldValuesJson: toSnapshot(current) as any,
        newValuesJson: toSnapshot(updated) as any,
        metaJson: { branchId, deliveryTimeSlotId } as any,
      });
    }
    return updated;
  }
}
