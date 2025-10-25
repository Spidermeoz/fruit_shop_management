// src/application/roles/usecases/EditRole.ts
import type { RoleRepository, UpdateRolePatch } from "../../../domain/roles/RoleRepository";
import { toRoleDTO } from "../dto";

export class EditRole {
  constructor(private repo: RoleRepository) {}

  async execute(id: number, patch: UpdateRolePatch) {
    const updated = await this.repo.update(id, patch);
    // thường controller chỉ cần { id }, nhưng trả đầy đủ để linh hoạt
    return { id: updated.props.id!, role: toRoleDTO(updated) };
  }
}
