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

export class SoftDeleteShippingZone {
  constructor(
    private readonly shippingZoneRepo: ShippingZoneRepository,
    private readonly createAuditLog?: CreateAuditLog,
  ) {}

  async execute(id: number, actor?: ActorContext) {
    const zoneId = Number(id);

    if (!zoneId || zoneId <= 0) {
      throw new Error("Zone id không hợp lệ");
    }

    const existed = await this.shippingZoneRepo.findById(zoneId);
    if (!existed) {
      throw new Error("Vùng giao hàng không tồn tại");
    }

    const deleted = await this.shippingZoneRepo.softDelete(zoneId);
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
        moduleName: "shipping_zone",
        entityType: "shipping_zone",
        entityId: Number(zoneId),
        requestId: actor?.requestId ?? null,
        ipAddress: actor?.ipAddress ?? null,
        userAgent: actor?.userAgent ?? null,
        oldValuesJson: toSnapshot(existed) as any,
        newValuesJson: { id: zoneId, deleted: !!deleted } as any,
      });
    }
    return {
      success: deleted,
    };
  }
}
