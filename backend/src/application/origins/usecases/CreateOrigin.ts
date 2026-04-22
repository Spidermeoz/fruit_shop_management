import type {
  CreateOriginInput,
  OriginRepository,
} from "../../../domain/products/OriginRepository";
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

export class CreateOrigin {
  constructor(
    private repo: OriginRepository,
    private createAuditLog?: CreateAuditLog,
  ) {}

  async execute(input: CreateOriginInput, actor?: ActorContext) {
    if (!input.name?.trim()) throw new Error("Name is required");

    const created = await this.repo.create({
      name: input.name.trim(),
      description: input.description ?? null,
      countryCode: input.countryCode ?? null,
      status: input.status ?? "active",
      position: input.position ?? null,
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
        moduleName: "origin",
        entityType: "origin",
        entityId: Number(created.id ?? 0) || null,
        requestId: actor?.requestId ?? null,
        ipAddress: actor?.ipAddress ?? null,
        userAgent: actor?.userAgent ?? null,
        newValuesJson: {
          id: Number(created?.id ?? 0),
          name: String(created?.name ?? ""),
          status: String(created?.status ?? ""),
        },
        metaJson: {
          descriptionLength: String(created?.description ?? "").length,
        },
      });
    }

    return { id: created.id! };
  }
}
