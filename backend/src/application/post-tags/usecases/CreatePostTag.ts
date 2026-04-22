import type {
  CreatePostTagInput,
  PostTagRepository,
} from "../../../domain/post-tags/PostTagRepository";
import type { CreateAuditLog } from "../../audit-logs/usecases/CreateAuditLog";

function normalizeNullableText(value?: string | null) {
  if (value === undefined || value === null) return null;

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

export class CreatePostTag {
  constructor(
    private repo: PostTagRepository,
    private createAuditLog?: CreateAuditLog,
  ) {}

  async execute(input: CreatePostTagInput, actor?: ActorContext) {
    if (!input.name?.trim()) {
      throw new Error("Name is required");
    }

    const created = await this.repo.create({
      name: input.name.trim(),
      description: normalizeNullableText(input.description),
      status: input.status ?? "active",
    });

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
        action: "create",
        moduleName: "post_tag",
        entityType: "post_tag",
        entityId: Number(created?.props?.id ?? 0) || null,
        requestId: actor?.requestId ?? null,
        ipAddress: actor?.ipAddress ?? null,
        userAgent: actor?.userAgent ?? null,
        newValuesJson: toSnapshot(created) as any,
      });
    }

    return { id: created.props.id! };
  }
}
