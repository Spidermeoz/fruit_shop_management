// src/application/roles/usecases/GetRoleDetail.ts
import type { RoleRepository } from "../../../domain/roles/RoleRepository";
import { toRoleDTO, type RoleDTO } from "../../roles/dto";

export type GetRoleDetailInput = {
  id: number;
  includeDeleted?: boolean;
};

export class GetRoleDetail {
  constructor(private repo: RoleRepository) {}

  async execute(input: number | GetRoleDetailInput): Promise<RoleDTO> {
    const id = typeof input === "number" ? input : input.id;
    const includeDeleted =
      typeof input === "number" ? false : (input.includeDeleted ?? false);

    const role = await this.repo.findById(id, includeDeleted);
    if (!role) {
      throw new Error("Role not found");
    }

    return toRoleDTO(role);
  }
}
