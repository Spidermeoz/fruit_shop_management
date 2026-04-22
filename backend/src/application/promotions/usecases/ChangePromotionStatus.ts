import type { PromotionRepository } from "../../../domain/promotions/PromotionRepository";
import type { PromotionStatus } from "../../../domain/promotions/types";
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

export class ChangePromotionStatus {
  constructor(
    private readonly promotionRepo: PromotionRepository,
    private createAuditLog?: CreateAuditLog,
  ) {}

  async execute(
    id: number,
    status: PromotionStatus,
    actor?: ActorContext,
  ): Promise<void> {
    const promotionId = Number(id);

    if (!Number.isFinite(promotionId) || promotionId <= 0) {
      throw new Error("ID khuyến mãi không hợp lệ");
    }

    if (!["active", "inactive"].includes(status)) {
      throw new Error("Trạng thái khuyến mãi không hợp lệ");
    }

    const existing = await this.promotionRepo.findById(promotionId);

    if (!existing) {
      throw new Error("Khuyến mãi không tồn tại");
    }

    await this.promotionRepo.changeStatus(promotionId, status);
    const after = await this.promotionRepo.findById(promotionId);

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
        moduleName: "promotion",
        entityType: "promotion",
        entityId: promotionId,
        requestId: actor?.requestId ?? null,
        ipAddress: actor?.ipAddress ?? null,
        userAgent: actor?.userAgent ?? null,
        oldValuesJson: toSnapshot(existing) as any,
        newValuesJson: toSnapshot(after) as any,
        metaJson: { status },
      });
    }

    return;
  }
}
