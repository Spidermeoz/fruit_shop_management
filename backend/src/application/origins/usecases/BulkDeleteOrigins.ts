import type { OriginRepository } from "../../../domain/products/OriginRepository";
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
  const branchId = actor?.branchIds
    .map(Number)
    .find((x) => Number.isFinite(x) && x > 0);
  return branchId ?? null;
};

const toSnapshot = (value: any) => value ?? null;

export class BulkDeleteOrigins {
  constructor(
    private repo: OriginRepository,
    private createAuditLog?: CreateAuditLog,
  ) {}

  async execute(ids: number[], actor?: ActorContext) {
    const normalized = Array.from(
      new Set(
        (ids || [])
          .map((id) => Number(id))
          .filter((id) => Number.isInteger(id) && id > 0),
      ),
    );

    if (normalized.length === 0) {
      throw new Error("Ids are required");
    }

    const before =
      typeof (this.repo as any).findByIds === "function"
        ? await (this.repo as any).findByIds(normalized)
        : await Promise.all(
            normalized.map(async (id) =>
              typeof (this.repo as any).findById === "function"
                ? await (this.repo as any).findById(id)
                : null,
            ),
          );

    const affected = await this.repo.bulkSoftDelete(normalized);

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
        action: "bulk_soft_delete",
        moduleName: "origin",
        entityType: "origin",
        entityId: null,
        requestId: actor?.requestId ?? null,
        ipAddress: actor?.ipAddress ?? null,
        userAgent: actor?.userAgent ?? null,
        oldValuesJson: before.map((item: any) => ({
          id: Number(item?.props?.id ?? 0),
          name: String(item?.props?.name ?? ""),
          status: String(item?.props?.status ?? ""),
        })),
        newValuesJson: {
          ids: normalized,
          deleted: true,
        },
        metaJson: {
          count: affected,
        },
      });
    }

    return {
      count: affected,
      ids: normalized,
    };
  }
}
