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

export class BulkDeleteShippingZones {
  constructor(
    private readonly shippingZoneRepo: ShippingZoneRepository,
    private readonly createAuditLog?: CreateAuditLog,
  ) {}

  async execute(input: { ids: number[] }, actor?: ActorContext) {
    const ids = [
      ...new Set(
        (input.ids ?? [])
          .map(Number)
          .filter((x) => Number.isInteger(x) && x > 0),
      ),
    ];
    if (!ids.length) throw new Error("Danh sách vùng giao hàng không hợp lệ");
    const result = await this.shippingZoneRepo.bulkDelete(ids);
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
        action: "bulk_delete",
        moduleName: "shipping_zone",
        entityType: "shipping_zone",
        entityId: null,
        requestId: actor?.requestId ?? null,
        ipAddress: actor?.ipAddress ?? null,
        userAgent: actor?.userAgent ?? null,
        metaJson: { ids } as any,
      });
    }
    return result;
  }
}
