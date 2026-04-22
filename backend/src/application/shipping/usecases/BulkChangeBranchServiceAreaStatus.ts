import type { BranchServiceAreaRepository } from "../../../domain/shipping/BranchServiceAreaRepository";

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

export class BulkChangeBranchServiceAreaStatus {
  constructor(
    private readonly branchServiceAreaRepo: BranchServiceAreaRepository,
    private readonly createAuditLog?: CreateAuditLog,
  ) {}

  async execute(
    input: { ids: number[]; status: "active" | "inactive" },
    actor?: ActorContext,
  ) {
    const ids = [
      ...new Set(
        (input.ids ?? [])
          .map(Number)
          .filter((x) => Number.isInteger(x) && x > 0),
      ),
    ];
    const status = String(input.status ?? "")
      .trim()
      .toLowerCase();
    if (!ids.length) throw new Error("Danh sách coverage không hợp lệ");
    if (!["active", "inactive"].includes(status))
      throw new Error("Trạng thái coverage không hợp lệ");
    const result = await this.branchServiceAreaRepo.bulkUpdateStatus({
      ids,
      status: status as "active" | "inactive",
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
        action: "bulk_change_status",
        moduleName: "branch_service_area",
        entityType: "branch_service_area",
        entityId: null,
        requestId: actor?.requestId ?? null,
        ipAddress: actor?.ipAddress ?? null,
        userAgent: actor?.userAgent ?? null,
        metaJson: { ids, status } as any,
      });
    }
    return result;
  }
}
