// src/application/roles/usecases/UpdateRole.ts
import type {
  RoleRepository,
  UpdateRolePatch,
} from "../../../domain/roles/RoleRepository";
import { toRoleDTO } from "../dto";

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

export class UpdateRole {
  constructor(private repo: RoleRepository) {}
  async execute(id: number, patch: UpdateRolePatch) {
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
    return { id: updated.props.id!, role: toRoleDTO(updated) };
  }
}
