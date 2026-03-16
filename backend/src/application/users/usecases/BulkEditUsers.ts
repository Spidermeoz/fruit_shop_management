// src/application/users/usecases/BulkEditUsers.ts
import type { UserRepository } from "../../../domain/users/UserRepository";

export type BulkEditInput =
  | { action: "status"; ids: number[]; value: "active" | "inactive" }
  | { action: "role"; ids: number[]; value: number | null }
  | { action: "delete"; ids: number[] }
  | { action: "restore"; ids: number[] };

export class BulkEditUsers {
  constructor(private repo: UserRepository) {}

  async execute(input: BulkEditInput, currentUserId?: number) {
    const { action, ids } = input;

    if (currentUserId) {
      if (ids.includes(currentUserId)) {
        throw new Error("Bạn không thể thao tác trên chính tài khoản của mình");
      }
    }

    let value: any = undefined;
    if (action === "status") value = input.value;
    if (action === "role") value = input.value;

    return this.repo.bulkEdit(ids, action, value);
  }
}
