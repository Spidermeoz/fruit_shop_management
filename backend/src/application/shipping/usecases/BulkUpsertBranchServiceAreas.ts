import type { BranchRepository } from "../../../domain/branches/BranchRepository";
import type { BranchServiceAreaRepository } from "../../../domain/shipping/BranchServiceAreaRepository";
import type { ShippingZoneRepository } from "../../../domain/shipping/ShippingZoneRepository";
import type { BulkUpsertBranchServiceAreaItem } from "../../../domain/shipping/branchServiceArea.types";

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

export class BulkUpsertBranchServiceAreas {
  constructor(
    private readonly branchServiceAreaRepo: BranchServiceAreaRepository,
    private readonly branchRepo: BranchRepository,
    private readonly shippingZoneRepo: ShippingZoneRepository,
    private readonly createAuditLog?: CreateAuditLog,
  ) {}

  async execute(
    input: {
      items: BulkUpsertBranchServiceAreaItem[];
      mode?: "skip_existing" | "overwrite" | "fail_on_conflict";
    },
    actor?: ActorContext,
  ) {
    const items = input.items ?? [];
    if (!items.length)
      throw new Error("Danh sách coverage cần lưu không hợp lệ");
    for (const item of items) {
      const branchId = Number(item.branchId);
      const shippingZoneId = Number(item.shippingZoneId);
      if (!Number.isInteger(branchId) || branchId <= 0)
        throw new Error("Chi nhánh không hợp lệ");
      if (!Number.isInteger(shippingZoneId) || shippingZoneId <= 0)
        throw new Error("Vùng giao hàng không hợp lệ");
      const branch = await this.branchRepo.findById(branchId);
      if (!branch) throw new Error(`Không tìm thấy chi nhánh #${branchId}`);
      const zone = await this.shippingZoneRepo.findById(shippingZoneId);
      if (!zone)
        throw new Error(`Không tìm thấy vùng giao hàng #${shippingZoneId}`);
    }
    const result = await this.branchServiceAreaRepo.bulkUpsert(
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
        moduleName: "branch_service_area",
        entityType: "branch_service_area",
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
