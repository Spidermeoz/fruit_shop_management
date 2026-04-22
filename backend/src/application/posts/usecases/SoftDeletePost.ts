import type { PostRepository } from "../../../domain/posts/PostRepository";
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

export class SoftDeletePost {
  constructor(
    private repo: PostRepository,
    private createAuditLog?: CreateAuditLog,
  ) {}

  async execute(id: number, deletedById?: number | null, actor?: ActorContext) {
    const before = await this.repo.findById(id);

    await this.repo.softDelete(id, deletedById ?? null);
    const after = before;

    if (this.createAuditLog) {
      await this.createAuditLog.execute({
        actorUserId:
          actor?.id !== undefined && actor?.id !== null
            ? Number(actor.id)
            : deletedById !== undefined && deletedById !== null
              ? Number(deletedById)
              : null,
        actorRoleId:
          actor?.roleId !== undefined && actor?.roleId !== null
            ? Number(actor.roleId)
            : null,
        branchId: pickActorBranchId(actor),
        action: "soft_delete",
        moduleName: "post",
        entityType: "post",
        entityId: Number(id),
        requestId: actor?.requestId ?? null,
        ipAddress: actor?.ipAddress ?? null,
        userAgent: actor?.userAgent ?? null,
        oldValuesJson: before
          ? {
              id: Number(before.props.id),
              title: String(before.props.title ?? ""),
              status: String(before.props.status ?? ""),
            }
          : null,
        newValuesJson: { id: Number(after?.props.id), deleted: true },
      });
    }

    return { id };
  }
}
