import type { PostTagRepository } from "../../../domain/post-tags/PostTagRepository";
import type { PostTagStatus } from "../../../domain/post-tags/types";
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

export class ChangePostTagStatus {
  constructor(
    private repo: PostTagRepository,
    private createAuditLog?: CreateAuditLog,
  ) {}

  async execute(id: number, status: PostTagStatus, actor?: ActorContext) {
    const before = await this.repo.findById(id);

    await this.repo.changeStatus(id, status);
    const after = await this.repo.findById(id);

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
        moduleName: "post_tag",
        entityType: "post_tag",
        entityId: Number(id),
        requestId: actor?.requestId ?? null,
        ipAddress: actor?.ipAddress ?? null,
        userAgent: actor?.userAgent ?? null,
        oldValuesJson: toSnapshot(before) as any,
        newValuesJson: toSnapshot(after) as any,
        metaJson: { status },
      });
    }

    return { id, status };
  }
}
