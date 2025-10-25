// src/application/users/usecases/BulkEditUsers.ts
import type { UserRepository } from "../../../domain/users/UserRepository";

export type BulkEditInput =
  | { action: "status"; ids: number[]; value: "active" | "inactive" }
  | { action: "role"; ids: number[]; value: number | null }
  | { action: "delete"; ids: number[] }
  | { action: "restore"; ids: number[] };

export class BulkEditUsers {
  constructor(private repo: UserRepository) {}

  async execute(input: BulkEditInput) {
    const { action, ids } = input;
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error("ids must be a non-empty array");
    }

    let value: any = undefined;
    if (action === "status") value = input.value;         // "active" | "inactive"
    if (action === "role") value = input.value;           // number | null

    const result = await this.repo.bulkEdit(ids, action, value);
    return result; // { affected }
  }
}
