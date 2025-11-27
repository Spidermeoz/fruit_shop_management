import type { UserRepository } from "../../../domain/users/UserRepository";

export class UpdateMyProfile {
  constructor(private userRepo: UserRepository) {}

  async execute(userId: number, input: {
    full_name?: string;
    phone?: string | null;
    avatar?: string | null;
  }) {
    const patch: any = {};

    if (input.full_name !== undefined) patch.fullName = input.full_name;
    if (input.phone !== undefined) patch.phone = input.phone;
    if (input.avatar !== undefined) patch.avatar = input.avatar;

    const updated = await this.userRepo.update(userId, patch);
    return updated.props;
  }
}
