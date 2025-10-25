// src/application/roles/usecases/SoftDeleteRole.ts
import type { RoleRepository } from "../../../domain/roles/RoleRepository";

export class SoftDeleteRole {
  constructor(private repo: RoleRepository) {}

  async execute(id: number) {
    const result = await this.repo.softDelete(id);
    // giữ tối giản để controller tự định dạng message như cũ
    return result; // { id, title }
  }
}
