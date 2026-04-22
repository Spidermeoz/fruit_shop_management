import type { UserRepository } from "../../../domain/users/UserRepository";
import type { CreateAuditLog } from "../../audit-logs/usecases/CreateAuditLog";

export type BulkEditInput =
  | { action: "status"; ids: number[]; value: "active" | "inactive" }
  | { action: "role"; ids: number[]; value: number | null }
  | { action: "delete"; ids: number[] }
  | { action: "restore"; ids: number[] };

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

export class BulkEditUsers {
  constructor(
    private repo: UserRepository,
    private createAuditLog?: CreateAuditLog,
  ) {}

  async execute(
    input: BulkEditInput,
    currentUserId?: number,
    actor?: ActorContext,
  ) {
    const { action, ids } = input;

    if (currentUserId) {
      if (ids.includes(currentUserId)) {
        throw new Error("Bạn không thể thao tác trên chính tài khoản của mình");
      }
    }

    let value: any = undefined;
    if (action === "status") value = input.value;
    if (action === "role") value = input.value;

    const result = await this.repo.bulkEdit(ids, action, value);

    if (this.createAuditLog) {
      await this.createAuditLog.execute({
        actorUserId:
          actor?.id !== undefined && actor?.id !== null
            ? Number(actor.id)
            : (currentUserId ?? null),
        actorRoleId:
          actor?.roleId !== undefined && actor?.roleId !== null
            ? Number(actor.roleId)
            : null,
        branchId: pickActorBranchId(actor),
        action: "bulk_edit",
        moduleName: "user",
        entityType: "user",
        entityId: null,
        requestId: actor?.requestId ?? null,
        ipAddress: actor?.ipAddress ?? null,
        userAgent: actor?.userAgent ?? null,
        newValuesJson: null,
        metaJson: {
          bulkAction: action,
          ids,
          value,
          total: ids.length,
        },
      });
    }

    return result;
  }
}
