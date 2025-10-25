// src/application/users/usecases/SoftDeleteUser.ts
import type { UserRepository } from "../../../domain/users/UserRepository";

export class SoftDeleteUser {
  constructor(private repo: UserRepository) {}
  async execute(id: number) {
    return this.repo.softDelete(id);
  }
}
