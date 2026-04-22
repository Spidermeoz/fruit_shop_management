import type { ShippingZoneRepository } from "../../../domain/shipping/ShippingZoneRepository";

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

export class BulkUpdateShippingZonePriority {
  constructor(
    private readonly shippingZoneRepo: ShippingZoneRepository,
    private readonly createAuditLog?: CreateAuditLog,
  ) {}

  async execute(
    input: { items: Array<{ id: number; priority: number }> },
    actor?: ActorContext,
  ) {
    const items = (input.items ?? []).map((item) => ({
      id: Number(item.id),
      priority: Number(item.priority),
    }));
    if (!items.length)
      throw new Error("Danh sách cập nhật priority không hợp lệ");
    for (const item of items) {
      if (!Number.isInteger(item.id) || item.id <= 0)
        throw new Error("ID vùng giao hàng không hợp lệ");
      if (!Number.isInteger(item.priority) || item.priority < 0)
        throw new Error("Priority phải là số nguyên >= 0");
    }
    const result = await this.shippingZoneRepo.bulkUpdatePriority(items);
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
        action: "bulk_update_priority",
        moduleName: "shipping_zone",
        entityType: "shipping_zone",
        entityId: null,
        requestId: actor?.requestId ?? null,
        ipAddress: actor?.ipAddress ?? null,
        userAgent: actor?.userAgent ?? null,
        metaJson: { items } as any,
      });
    }
    return result;
  }
}
