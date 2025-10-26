// src/application/auth/usecases/Logout.ts
import type { UserRepository } from "../../../domain/users/UserRepository";

export class Logout {
  constructor(private users: UserRepository) {}
  async execute(userId: number) {
    await this.users.updateApiToken(userId, null);
    return { ok: true };
  }
}
