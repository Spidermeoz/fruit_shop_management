import type {
  BulkEditPostTagsInput,
  PostTagRepository,
} from "../../../domain/post-tags/PostTagRepository";
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

export class BulkEditPostTags {
  constructor(
    private repo: PostTagRepository,
    private createAuditLog?: CreateAuditLog,
  ) {}

  async execute(input: BulkEditPostTagsInput, actor?: ActorContext) {
    const ids = Array.from(
      new Set(
        (input.ids || []).map((id) => Number(id)).filter(Number.isFinite),
      ),
    );

    if (!ids.length) {
      throw new Error("No post tag ids provided");
    }

    const patch = input.patch || {};

    if (!Object.keys(patch).length) {
      throw new Error("No bulk edit patch provided");
    }

    const before = await Promise.all(
      ids.map(async (id) =>
        typeof (this.repo as any).findById === "function"
          ? await (this.repo as any).findById(id)
          : null,
      ),
    );

    const affected = await this.repo.bulkEdit({
      ids,
      patch,
    });

    const after = await Promise.all(
      ids.map(async (id) =>
        typeof (this.repo as any).findById === "function"
          ? await (this.repo as any).findById(id)
          : null,
      ),
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
        action: "bulk_update",
        moduleName: "post_tag",
        entityType: "post_tag",
        entityId: null,
        requestId: actor?.requestId ?? null,
        ipAddress: actor?.ipAddress ?? null,
        userAgent: actor?.userAgent ?? null,
        oldValuesJson: before.map(toSnapshot),
        newValuesJson: after.map(toSnapshot),
        metaJson: { ids, patch, affected },
      });
    }

    return {
      affected,
      ids,
    };
  }
}
