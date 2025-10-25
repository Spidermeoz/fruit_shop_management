// src/application/users/usecases/EditUser.ts
import bcrypt from "bcryptjs";
import type { UserRepository, UpdateUserPatch } from "../../../domain/users/UserRepository";
import { toUserDTO } from "../../users/dto";

export type EditUserInput = Partial<{
  roleId: number | null;
  fullName: string | null;
  email: string;
  password: string | null;     // plain; nếu null/undefined → không đổi
  phone: string | null;
  avatar: string | null;
  status: "active" | "inactive" | "banned";
}>;

export class EditUser {
  constructor(private repo: UserRepository) {}

  async execute(id: number, patch: EditUserInput) {
    const outPatch: UpdateUserPatch = {};

    if (patch.roleId !== undefined) outPatch.roleId = patch.roleId;
    if (patch.fullName !== undefined) outPatch.fullName = patch.fullName;
    if (patch.email !== undefined)
      outPatch.email = patch.email.trim().toLowerCase();
    if (patch.phone !== undefined) outPatch.phone = patch.phone;
    if (patch.avatar !== undefined) outPatch.avatar = patch.avatar;
    if (patch.status !== undefined) outPatch.status = patch.status;

    // hash nếu có password mới và không rỗng
    if (patch.password !== undefined) {
      if (patch.password && patch.password.trim() !== "") {
        outPatch.passwordHash = await bcrypt.hash(patch.password, 10);
      } else {
        outPatch.passwordHash = undefined; // không đổi
      }
    }

    const updated = await this.repo.update(id, outPatch);
    return { id: updated.props.id!, user: toUserDTO(updated) };
  }
}
