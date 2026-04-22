import type { BranchRepository } from "../../../domain/branches/BranchRepository";
import type {
  BranchDeliveryTimeSlotRepository,
  BulkUpsertBranchDeliveryTimeSlotItem,
} from "../../../domain/shipping/BranchDeliveryTimeSlotRepository";
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

export class BulkUpsertBranchDeliveryTimeSlots {
  constructor(
    private readonly branchDeliveryTimeSlotRepo: BranchDeliveryTimeSlotRepository,
    private readonly branchRepo: BranchRepository,
    private readonly deliveryTimeSlotRepo: DeliveryTimeSlotRepository,
    private readonly createAuditLog?: CreateAuditLog,
  ) {}

  async execute(
    input: {
      items: BulkUpsertBranchDeliveryTimeSlotItem[];
      mode?: "skip_existing" | "overwrite" | "fail_on_conflict";
    },
    actor?: ActorContext,
  ) {
    const items = input.items ?? [];
    if (!items.length)
      throw new Error("Danh sách branch slot cần lưu không hợp lệ");
    for (const item of items) {
      const branchId = Number(item.branchId);
      const deliveryTimeSlotId = Number(item.deliveryTimeSlotId);
      if (!Number.isInteger(branchId) || branchId <= 0)
        throw new Error("Chi nhánh không hợp lệ");
      if (!Number.isInteger(deliveryTimeSlotId) || deliveryTimeSlotId <= 0)
        throw new Error("Khung giờ không hợp lệ");
      const branch = await this.branchRepo.findById(branchId);
      if (!branch) throw new Error(`Không tìm thấy chi nhánh #${branchId}`);
      const slot = await this.deliveryTimeSlotRepo.findById(deliveryTimeSlotId);
      if (!slot)
        throw new Error(`Không tìm thấy khung giờ #${deliveryTimeSlotId}`);
    }
    const result = await this.branchDeliveryTimeSlotRepo.bulkUpsert(
      items,
      input.mode,
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
        action: "bulk_upsert",
        moduleName: "branch_delivery_time_slot",
        entityType: "branch_delivery_time_slot",
        entityId: null,
        requestId: actor?.requestId ?? null,
        ipAddress: actor?.ipAddress ?? null,
        userAgent: actor?.userAgent ?? null,
        metaJson: { items, mode: input.mode ?? null } as any,
      });
    }
    return result;
  }
}
