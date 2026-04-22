import type { BranchRepository } from "../../../domain/branches/BranchRepository";
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

export class ChangeBranchStatus {
  constructor(
    private readonly branchRepo: BranchRepository,
    private createAuditLog?: CreateAuditLog,
  ) {}

  async execute(
    id: number,
    status: "active" | "inactive",
    actor?: ActorContext,
  ) {
    const branchId = Number(id);
    if (!branchId || branchId <= 0) {
      throw new Error("Branch id không hợp lệ");
    }

    if (!["active", "inactive"].includes(status)) {
      throw new Error("Trạng thái chi nhánh không hợp lệ");
    }

    const before = await this.branchRepo.findById(branchId);
    const updated = await this.branchRepo.updateStatus(branchId, status);

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
        moduleName: "branch",
        entityType: "branch",
        entityId: branchId,
        requestId: actor?.requestId ?? null,
        ipAddress: actor?.ipAddress ?? null,
        userAgent: actor?.userAgent ?? null,
        oldValuesJson: {
          id: Number(branchId),
          name: String(before?.props?.name ?? ""),
          code: String(before?.props?.code ?? ""),
          previousStatus: String(before?.props?.status ?? ""),
        },
        newValuesJson: {
          id: Number(branchId),
          name: String(updated.props?.name ?? before?.props?.name ?? ""),
          code: String(updated.props?.code ?? before?.props?.code ?? ""),
          nextStatus: String(updated.props?.status ?? status),
        },
        metaJson: {
          province: String(
            updated.props?.province ?? before?.props?.province ?? "",
          ),
        },
      });
    }

    return updated.props;
  }
}
