import { PostTag } from "../../../domain/post-tags/PostTag";
import type {
  PostTagRepository,
  UpdatePostTagPatch,
} from "../../../domain/post-tags/PostTagRepository";
import type { CreateAuditLog } from "../../audit-logs/usecases/CreateAuditLog";

function normalizeNullableText(value?: string | null) {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const normalized = String(value).trim();
  return normalized ? normalized : null;
}

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

export class EditPostTag {
  constructor(
    private repo: PostTagRepository,
    private createAuditLog?: CreateAuditLog,
  ) {}

  async execute(id: number, patch: UpdatePostTagPatch, actor?: ActorContext) {
    const existingTag = await this.repo.findById(id);

    if (!existingTag) {
      throw new Error("Post tag not found");
    }

    const beforeSnapshot = toSnapshot(existingTag);

    const normalizedPatch: UpdatePostTagPatch = {
      ...(patch.name !== undefined ? { name: String(patch.name).trim() } : {}),
      ...(patch.description !== undefined
        ? { description: normalizeNullableText(patch.description) }
        : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.deleted !== undefined ? { deleted: !!patch.deleted } : {}),
    };

    const updatedTag = PostTag.create({
      ...existingTag.props,
      ...normalizedPatch,
      name:
        normalizedPatch.name !== undefined
          ? normalizedPatch.name
          : existingTag.props.name,
    });

    const updatePayload: UpdatePostTagPatch = {
      name: updatedTag.props.name,
      description: updatedTag.props.description ?? null,
      status: updatedTag.props.status,
      ...(normalizedPatch.deleted !== undefined
        ? { deleted: normalizedPatch.deleted }
        : {}),
    };

    const saved = await this.repo.update(id, updatePayload);

    if (this.createAuditLog) {
      const fresh = await this.repo.findById(id);
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
        action: "update",
        moduleName: "post_tag",
        entityType: "post_tag",
        entityId: Number(id),
        requestId: actor?.requestId ?? null,
        ipAddress: actor?.ipAddress ?? null,
        userAgent: actor?.userAgent ?? null,
        oldValuesJson: beforeSnapshot as any,
        newValuesJson: toSnapshot(fresh ?? saved) as any,
        metaJson: { changedFields: Object.keys(updatePayload) },
      });
    }

    return saved;
  }
}
