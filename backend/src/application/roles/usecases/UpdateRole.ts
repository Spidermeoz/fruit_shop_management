// src/application/roles/usecases/UpdateRole.ts
import type { RoleRepository, UpdateRolePatch } from "../../../domain/roles/RoleRepository";
import { toRoleDTO } from "../dto";

export class UpdateRole {
  constructor(private repo: RoleRepository) {}
  async execute(id: number, patch: UpdateRolePatch) {
    const updated = await this.repo.update(id, patch);
    return { id: updated.props.id!, role: toRoleDTO(updated) };
  }
}
