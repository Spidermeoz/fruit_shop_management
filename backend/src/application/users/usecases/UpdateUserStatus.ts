import type { UserRepository } from "../../../domain/users/UserRepository";
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

export class UpdateUserStatus {
  constructor(
    private repo: UserRepository,
    private createAuditLog?: CreateAuditLog,
  ) {}

  async execute(
    id: number,
    status: "active" | "inactive",
    currentUserId: number,
    actor?: ActorContext,
  ) {
    if (id === currentUserId) {
      throw new Error("Bạn không thể thay đổi trạng thái của chính mình");
    }

    const before =
      typeof (this.repo as any).findById === "function"
        ? await (this.repo as any).findById(id, true)
        : null;

    const result = await this.repo.updateStatus(id, status);

    const after =
      typeof (this.repo as any).findById === "function"
        ? await (this.repo as any).findById(id, true)
        : null;

    if (this.createAuditLog) {
      await this.createAuditLog.execute({
        actorUserId:
          actor?.id !== undefined && actor?.id !== null
            ? Number(actor.id)
            : Number(currentUserId),
        actorRoleId:
          actor?.roleId !== undefined && actor?.roleId !== null
            ? Number(actor.roleId)
            : null,
        branchId: pickActorBranchId(actor),
        action: "change_status",
        moduleName: "user",
        entityType: "user",
        entityId: Number(id),
        requestId: actor?.requestId ?? null,
        ipAddress: actor?.ipAddress ?? null,
        userAgent: actor?.userAgent ?? null,
        oldValuesJson: before?.props ?? null,
        newValuesJson: after ?? result ?? { id, status },
        metaJson: { status },
      });
    }

    return result;
  }
}
