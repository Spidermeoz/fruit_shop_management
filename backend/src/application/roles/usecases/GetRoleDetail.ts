// src/application/roles/usecases/GetRoleDetail.ts
import type { RoleRepository } from "../../../domain/roles/RoleRepository";
import { toRoleDTO, type RoleDTO } from "../../roles/dto";

export class GetRoleDetail {
  constructor(private repo: RoleRepository) {}

  async execute(id: number): Promise<RoleDTO> {
    const role = await this.repo.findById(id);
    if (!role) throw new Error("Role not found");
    return toRoleDTO(role);
  }
}
