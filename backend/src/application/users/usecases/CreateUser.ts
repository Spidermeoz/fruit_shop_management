// src/application/users/usecases/CreateUser.ts
import bcrypt from "bcryptjs";
import type { UserRepository } from "../../../domain/users/UserRepository";
import { toUserDTO, type UserDTO } from "../../users/dto";

export type CreateUserInput = {
  roleId?: number | null;
  fullName?: string | null;
  email: string;
  password: string;               // plain
  phone?: string | null;
  avatar?: string | null;
  status?: "active" | "inactive" | "banned";
};

export class CreateUser {
  constructor(private repo: UserRepository) {}

  async execute(input: CreateUserInput): Promise<UserDTO> {
    const passwordHash = await bcrypt.hash(input.password, 10);

    const created = await this.repo.create({
      roleId: input.roleId ?? null,
      fullName: input.fullName ?? null,
      email: input.email.trim().toLowerCase(),
      passwordHash,
      phone: input.phone ?? null,
      avatar: input.avatar ?? null,
      status: (input.status as any) ?? "active",
    });

    return toUserDTO(created);
  }
}
