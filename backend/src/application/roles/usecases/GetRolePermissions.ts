// src/application/roles/usecases/GetRolePermissions.ts
import type { RoleRepository } from "../../../domain/roles/RoleRepository";
import type { Permissions } from "../../../domain/roles/types";

export class GetRolePermissions {
  constructor(private repo: RoleRepository) {}
  async execute(id: number): Promise<Permissions | {}> {
    const role = await this.repo.findById(id, false);
    if (!role) throw new Error("Role not found");
    return role.props.permissions ?? {};
  }
}
