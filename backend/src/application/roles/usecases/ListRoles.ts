// src/application/roles/usecases/ListRoles.ts
import type { RoleRepository } from "../../../domain/roles/RoleRepository";
import type { RoleScope } from "../../../domain/roles/types";
import { toRoleDTO, type RoleDTO } from "../../roles/dto";

export type ListRolesInput = {
  includeDeleted?: boolean;
  q?: string;
  scope?: RoleScope;
  assignableOnly?: boolean;
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
