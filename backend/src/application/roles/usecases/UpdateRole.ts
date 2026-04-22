import type {
  RoleRepository,
  UpdateRolePatch,
} from "../../../domain/roles/RoleRepository";
import { toRoleDTO } from "../dto";
import type { CreateAuditLog } from "../../audit-logs/usecases/CreateAuditLog";

const normalizePermissions = (
  input: unknown,
): Record<string, string[]> | null | undefined => {
  if (input === undefined) return undefined;
  if (input === null) return null;
  if (typeof input !== "object" || Array.isArray(input)) return null;

  const out: Record<string, string[]> = {};

  for (const [moduleKey, rawActions] of Object.entries(
    input as Record<string, unknown>,
  )) {
    const normalizedModuleKey = String(moduleKey).trim();
    if (!normalizedModuleKey) continue;

    if (Array.isArray(rawActions)) {
      out[normalizedModuleKey] = rawActions
        .map((x) => String(x).trim())
        .filter(Boolean);
      continue;
    }

    if (rawActions !== null && rawActions !== undefined) {
      const single = String(rawActions).trim();
      out[normalizedModuleKey] = single ? [single] : [];
    }
  }

  return out;
};

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

export class UpdateRole {
  constructor(
    private repo: RoleRepository,
    private createAuditLog?: CreateAuditLog,
  ) {}
  async execute(id: number, patch: UpdateRolePatch, actor?: ActorContext) {
    const before =
      typeof (this.repo as any).findById === "function"
        ? await (this.repo as any).findById(id, false)
        : null;

    const normalizedPatch: UpdateRolePatch = {};

    if (patch.code !== undefined) {
      normalizedPatch.code = String(patch.code).trim().toLowerCase();
    }

    if (patch.scope !== undefined) {
      normalizedPatch.scope =
        patch.scope === "system" ||
        patch.scope === "branch" ||
        patch.scope === "client"
          ? patch.scope
          : "branch";
    }

    if (patch.level !== undefined) {
      normalizedPatch.level = Number(patch.level);
    }

    if (patch.isAssignable !== undefined) {
      normalizedPatch.isAssignable = !!patch.isAssignable;
    }

    if (patch.isProtected !== undefined) {
      normalizedPatch.isProtected = !!patch.isProtected;
    }

    if (patch.title !== undefined) {
      normalizedPatch.title = String(patch.title).trim();
    }

    if (patch.description !== undefined) {
      normalizedPatch.description = patch.description ?? null;
    }

    if (patch.permissions !== undefined) {
      normalizedPatch.permissions = normalizePermissions(patch.permissions);
    }

    if (Object.keys(normalizedPatch).length === 0) {
      throw new Error("No changes provided");
    }

    const updated = await this.repo.update(id, normalizedPatch);
    const result = { id: updated.props.id!, role: toRoleDTO(updated) };

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
        action: "update",
        moduleName: "role",
        entityType: "role",
        entityId: Number(id),
        requestId: actor?.requestId ?? null,
        ipAddress: actor?.ipAddress ?? null,
        userAgent: actor?.userAgent ?? null,
        oldValuesJson: before ? (toRoleDTO(before as any) as any) : null,
        newValuesJson: result.role as any,
        metaJson: { changedFields: Object.keys(normalizedPatch) },
      });
    }

    return result;
  }
}
