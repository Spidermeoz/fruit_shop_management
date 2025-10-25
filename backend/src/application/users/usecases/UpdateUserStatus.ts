// src/application/users/usecases/UpdateUserStatus.ts
import type { UserRepository } from "../../../domain/users/UserRepository";

export class UpdateUserStatus {
  constructor(private repo: UserRepository) {}

  async execute(id: number, status: "active" | "inactive") {
    return this.repo.updateStatus(id, status);
  }
}
