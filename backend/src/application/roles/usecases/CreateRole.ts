// src/application/roles/usecases/CreateRole.ts
import type { RoleRepository } from "../../../domain/roles/RoleRepository";
import { Role } from "../../../domain/roles/Role";
import { toRoleDTO, type RoleDTO } from "../../roles/dto";

export type CreateRoleInput = {
  title: string;
  description?: string | null;
  permissions?: Record<string, string[]> | null;
};

export class CreateRole {
  constructor(private repo: RoleRepository) {}

  async execute(input: CreateRoleInput): Promise<RoleDTO> {
    // Dùng domain để validate/normalize
    const role = Role.create({
      title: input.title,
      description: input.description ?? null,
      permissions: input.permissions ?? null,
      deleted: false,
    });

    // ⬇️ Truyền đúng shape CreateRoleInput cho repo
    const created = await this.repo.create({
      title: role.props.title,
      description: role.props.description,
      permissions: role.props.permissions,
    });

    return toRoleDTO(created);
  }
}
