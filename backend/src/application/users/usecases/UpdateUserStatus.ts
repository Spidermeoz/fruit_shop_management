// src/application/users/usecases/UpdateUserStatus.ts
import type { UserRepository } from "../../../domain/users/UserRepository";

export class UpdateUserStatus {
  constructor(private repo: UserRepository) {}

  async execute(
    id: number,
    status: "active" | "inactive",
    currentUserId: number,
  ) {
    // Không cho phép tự khóa chính mình
    if (id === currentUserId) {
      throw new Error("Bạn không thể thay đổi trạng thái của chính mình");
    }

    return this.repo.updateStatus(id, status);
  }
}
