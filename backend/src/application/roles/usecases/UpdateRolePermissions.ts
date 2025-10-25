// src/application/roles/usecases/UpdateRolePermissions.ts
import type { RoleRepository } from "../../../domain/roles/RoleRepository";
import type { Permissions } from "../../../domain/roles/types";

export class UpdateRolePermissions {
  constructor(private repo: RoleRepository) {}

  /**
   * roles: [{ id, permissions }]
   * Controller sẽ nhận payload theo format cũ rồi chuyển về dạng này.
   */
  async execute(roles: Array<{ id: number; permissions: Permissions }>) {
    if (!Array.isArray(roles) || roles.length === 0) {
      throw new Error("roles must be a non-empty array");
    }
    await this.repo.updatePermissions(roles);
    return { updated: roles.length };
  }
}
