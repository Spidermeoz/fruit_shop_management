import type { UserRepository } from "../../../domain/users/UserRepository";
import type { PasswordService } from "../services/PasswordService";

export class ChangePassword {
  constructor(
    private userRepo: UserRepository,
    private passwordService: PasswordService
  ) {}

  async execute(userId: number, currentPassword: string, newPassword: string) {
    // 1) Lấy user với hash
    const auth = await this.userRepo.findAuthByEmail;
    const found = await this.userRepo.findById(userId, false);
    if (!found) throw new Error("User not found");

    // Lấy record auth đầy đủ
    const authRecord = await this.userRepo.findAuthByEmail(found.props.email);
    if (!authRecord) throw new Error("Không tìm thấy thông tin xác thực");

    const { passwordHash } = authRecord;

    // 2) Kiểm tra mật khẩu cũ
    const ok = await this.passwordService.compare(currentPassword, passwordHash);
    if (!ok) throw new Error("Mật khẩu hiện tại không đúng");

    // 3) Hash mật khẩu mới
    const newHash = await this.passwordService.hash(newPassword);

    // 4) Update repository
    await this.userRepo.update(userId, { passwordHash: newHash });

    return true;
  }
}
