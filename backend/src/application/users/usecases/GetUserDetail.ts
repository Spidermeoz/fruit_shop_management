// src/application/users/usecases/GetUserDetail.ts
import type { UserRepository } from "../../../domain/users/UserRepository";
import { toUserDTO, type UserDTO } from "../../users/dto";

export class GetUserDetail {
  constructor(private repo: UserRepository) {}
  async execute(id: number, includeDeleted = false): Promise<UserDTO | null> {
    const u = await this.repo.findById(id, includeDeleted);
    return u ? toUserDTO(u) : null;
  }
}
