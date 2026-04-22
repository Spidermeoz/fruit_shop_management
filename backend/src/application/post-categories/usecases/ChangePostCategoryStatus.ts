import type { PostCategoryRepository } from "../../../domain/post-categories/PostCategoryRepository";
import type { PostCategoryStatus } from "../../../domain/post-categories/types";
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

export class ChangePostCategoryStatus {
  constructor(
    private repo: PostCategoryRepository,
    private createAuditLog?: CreateAuditLog,
  ) {}

  async execute(id: number, status: PostCategoryStatus, actor?: ActorContext) {
    const existing = await this.repo.findById(id);
    const before = await this.repo.findById(id);

    if (!existing) {
      throw new Error("Post category not found");
    }

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
        moduleName: "post_category",
        entityType: "post_category",
        entityId: Number(id),
        requestId: actor?.requestId ?? null,
        ipAddress: actor?.ipAddress ?? null,
        userAgent: actor?.userAgent ?? null,
        oldValuesJson: {
          id: Number(id),
          name: String(before?.props?.title ?? ""),
          previousStatus: String(before?.props?.status ?? ""),
        },
        newValuesJson: {
          id: Number(id),
          title: String(after?.props?.title ?? before?.props?.title ?? ""),
          nextStatus: String(after?.props?.status ?? status),
        },
        metaJson: {
          slug: String(after?.props?.slug ?? before?.props?.slug ?? ""),
        },
      });
    }

    return { id, status };
  }
}
