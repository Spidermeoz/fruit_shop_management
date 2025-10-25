// src/application/roles/usecases/ListRolesForPermissions.ts
import type { RoleRepository } from "../../../domain/roles/RoleRepository";

export class ListRolesForPermissions {
  constructor(private repo: RoleRepository) {}

  /**
   * Trả về mảng: [{ id, title, permissions }]
   * Controller sẽ wrap theo đúng format cũ của /permissions.
   */
  async execute() {
    const roles = await this.repo.listForPermissions();
    return roles;
  }
}
