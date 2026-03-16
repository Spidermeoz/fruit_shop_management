// src/application/users/usecases/SoftDeleteUser.ts
import type { UserRepository } from "../../../domain/users/UserRepository";

export class SoftDeleteUser {
  constructor(private repo: UserRepository) {}
  async execute(id: number, currentUserId?: number) {
    if (id === currentUserId) {
      throw new Error("Bạn không thể xóa chính tài khoản của mình");
    }

    return this.repo.softDelete(id);
  }
}
