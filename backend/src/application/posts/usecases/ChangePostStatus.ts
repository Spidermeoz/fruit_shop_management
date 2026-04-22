import type { PostRepository } from "../../../domain/posts/PostRepository";
import { isPostStatus, type PostStatus } from "../../../domain/posts/types";
import type { CreateAuditLog } from "../../audit-logs/usecases/CreateAuditLog";

function hasMeaningfulContent(content?: string | null) {
  const text = String(content ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return text.length > 0;
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

export class ChangePostStatus {
  constructor(
    private repo: PostRepository,
    private createAuditLog?: CreateAuditLog,
  ) {}

  async execute(id: number, status: PostStatus, actor?: ActorContext) {
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      throw new Error("Post id is invalid");
    }

    if (!isPostStatus(status)) {
      throw new Error("Post status is invalid");
    }

    const before = await this.repo.findById(Number(id));
    if (!before) {
      throw new Error("Post not found");
    }

    if (status === "published") {
      if (!before.props.title?.trim()) {
        throw new Error("Published post must have title");
      }

      if (!before.props.slug?.trim()) {
        throw new Error("Published post must have a valid slug");
      }

      if (!hasMeaningfulContent(before.props.content)) {
        throw new Error("Published post must have content");
      }
    }

    await this.repo.changeStatus(Number(id), status);
    const after = await this.repo.findById(Number(id));

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
              previousStatus: String(before.props.status ?? ""),
            }
          : null,
        newValuesJson: after
          ? {
              id: Number(after.props.id),
              title: String(after.props.title ?? ""),
              nextStatus: String(after.props.status ?? ""),
            }
          : null,
        metaJson: { slug: String(after?.props?.slug ?? "") },
      });
    }

    return { id: Number(id), status };
  }
}
