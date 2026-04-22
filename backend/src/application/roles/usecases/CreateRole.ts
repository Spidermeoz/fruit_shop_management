import type { RoleRepository } from "../../../domain/roles/RoleRepository";
import { Role } from "../../../domain/roles/Role";
import { toRoleDTO, type RoleDTO } from "../../roles/dto";
import type { CreateAuditLog } from "../../audit-logs/usecases/CreateAuditLog";

const normalizePermissions = (
  input: unknown,
): Record<string, string[]> | null => {
  if (input === null || input === undefined) return null;
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

export type CreateRoleInput = {
  code: string;
  scope?: "system" | "branch" | "client";
  level?: number;
  isAssignable?: boolean;
  isProtected?: boolean;
  title: string;
  description?: string | null;
  permissions?: Record<string, string[]> | null;
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

export class CreateRole {
  constructor(
    private repo: RoleRepository,
    private createAuditLog?: CreateAuditLog,
  ) {}

  async execute(
    input: CreateRoleInput,
    actor?: ActorContext,
  ): Promise<RoleDTO> {
    const normalizedCode = String(input.code ?? "")
      .trim()
      .toLowerCase();

    const normalizedTitle = String(input.title ?? "").trim();

    const normalizedScope =
      input.scope === "system" ||
      input.scope === "branch" ||
      input.scope === "client"
        ? input.scope
        : "branch";

    const normalizedLevel =
      input.level === null || input.level === undefined
        ? 10
        : Number(input.level);

    const normalizedPermissions = normalizePermissions(input.permissions);

    const role = Role.create({
      code: normalizedCode,
      scope: normalizedScope,
      level: normalizedLevel,
      isAssignable: input.isAssignable ?? true,
      isProtected: input.isProtected ?? false,
      title: normalizedTitle,
      description:
        input.description !== undefined ? (input.description ?? null) : null,
      permissions: normalizedPermissions,
      deleted: false,
    });

    const created = await this.repo.create({
      code: role.props.code,
      scope: role.props.scope,
      level: role.props.level,
      isAssignable: role.props.isAssignable,
      isProtected: role.props.isProtected,
      title: role.props.title,
      description: role.props.description,
      permissions: role.props.permissions,
    });

    const dto = toRoleDTO(created);

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
        moduleName: "role",
        entityType: "role",
        entityId: Number(created.props.id),
        requestId: actor?.requestId ?? null,
        ipAddress: actor?.ipAddress ?? null,
        userAgent: actor?.userAgent ?? null,
        newValuesJson: dto as any,
      });
    }

    return dto;
  }
}
