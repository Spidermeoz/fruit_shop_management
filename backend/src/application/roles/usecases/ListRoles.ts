// src/application/roles/usecases/ListRoles.ts
import type { RoleRepository } from "../../../domain/roles/RoleRepository";
import { toRoleDTO, type RoleDTO } from "../../roles/dto";

export type ListRolesInput = {
  includeDeleted?: boolean; // mặc định false
  q?: string;               // tìm theo title (tuỳ repo)
};

export type ListRolesOutput = {
  count: number;
  rows: RoleDTO[];
};

export class ListRoles {
  constructor(private repo: RoleRepository) {}

  async execute(input: ListRolesInput = {}): Promise<ListRolesOutput> {
    const { includeDeleted = false, q } = input;

    const { count, rows } = await this.repo.list({
      includeDeleted,
      q,
    });

    return {
      count,
      rows: rows.map(toRoleDTO),
    };
  }
}
