// src/application/roles/usecases/UpdateRolePermissions.ts
import type { RoleRepository } from "../../../domain/roles/RoleRepository";
import type { Permissions } from "../../../domain/roles/types";

export type UpdateRolePermissionsInput =
  | { id: number; permissions: Permissions }
  | Array<{ id: number; permissions: Permissions }>;

export class UpdateRolePermissions {
  constructor(private repo: RoleRepository) {}

  /**
   * Hỗ trợ cả 2 format:
   * 1) Single role: { id, permissions }
   * 2) Bulk roles: [{ id, permissions }]
   */
  async execute(input: UpdateRolePermissionsInput) {
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

    await this.repo.updatePermissions(normalized);
    return { updated: normalized.length };
  }
}
