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

export class SoftDeleteBranchServiceArea {
  constructor(
    private readonly branchServiceAreaRepo: BranchServiceAreaRepository,
    private readonly createAuditLog?: CreateAuditLog,
  ) {}

  async execute(id: number, actor?: ActorContext) {
    const serviceAreaId = Number(id);

    if (!serviceAreaId || serviceAreaId <= 0) {
      throw new Error("Branch service area id không hợp lệ");
    }

    const existed = await this.branchServiceAreaRepo.findById(serviceAreaId);
    if (!existed) {
      throw new Error("Không tìm thấy cấu hình vùng phục vụ");
    }

    const deleted = await this.branchServiceAreaRepo.softDelete(serviceAreaId);
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
        moduleName: "branch_service_area",
        entityType: "branch_service_area",
        entityId: Number(serviceAreaId),
        requestId: actor?.requestId ?? null,
        ipAddress: actor?.ipAddress ?? null,
        userAgent: actor?.userAgent ?? null,
        oldValuesJson: toSnapshot(existed) as any,
        newValuesJson: toSnapshot(deleted) as any,
      });
    }
    return {
      id: deleted.id,
      deletedAt: deleted.deletedAt,
    };
  }
}
