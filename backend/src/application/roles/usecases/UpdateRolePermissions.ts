import type { RoleRepository } from "../../../domain/roles/RoleRepository";
import type { Permissions } from "../../../domain/roles/types";
import type { CreateAuditLog } from "../../audit-logs/usecases/CreateAuditLog";

export type UpdateRolePermissionsInput =
  | { id: number; permissions: Permissions }
  | Array<{ id: number; permissions: Permissions }>;

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

export class UpdateRolePermissions {
  constructor(
    private repo: RoleRepository,
    private createAuditLog?: CreateAuditLog,
  ) {}

  async execute(input: UpdateRolePermissionsInput, actor?: ActorContext) {
    const roles = Array.isArray(input) ? input : [input];

    const normalized = roles
      .filter((r) => r && Number(r.id) > 0)
      .map((r) => ({
        id: Number(r.id),
        permissions:
          r.permissions && typeof r.permissions === "object"
            ? r.permissions
            : ({} as Permissions),
      }));

    if (!normalized.length) {
      throw new Error("roles must be a non-empty array");
    }

    const before =
      typeof (this.repo as any).findById === "function"
        ? await Promise.all(
            normalized.map((x) => (this.repo as any).findById(x.id, false)),
          )
        : [];

    await this.repo.updatePermissions(normalized);

    if (this.createAuditLog) {
      for (let index = 0; index < normalized.length; index += 1) {
        const current = normalized[index];
        const previous = before[index];

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
          action: "update_permissions",
          moduleName: "role",
          entityType: "role",
          entityId: current.id,
          requestId: actor?.requestId ?? null,
          ipAddress: actor?.ipAddress ?? null,
          userAgent: actor?.userAgent ?? null,
          oldValuesJson: previous?.props?.permissions ?? null,
          newValuesJson: current.permissions as any,
        });
      }
    }

    return { updated: normalized.length };
  }
}
