// src/application/auth/usecases/RefreshToken.ts
import type { UserRepository } from "../../../domain/users/UserRepository";
import type { TokenService } from "../../auth/services/TokenService";
import type { RefreshTokenService } from "../../auth/services/RefreshTokenService";

export class RefreshToken {
  constructor(
    private users: UserRepository,
    private token: TokenService,
    private refresh: RefreshTokenService
  ) {}

  /**
   * Nhận refresh token (raw), so khớp hash trong DB:
   *  - Nếu hợp lệ -> phát hành accessToken mới và (tuỳ bạn) cấp refresh mới.
   *  - Ở đây: cấp access mới, GIỮ nguyên refresh cũ (đơn giản, ít đổi logic).
   */
  async execute(input: { refreshToken: string }) {
    const hash = this.refresh.hash(input.refreshToken);
    const u = await this.users.findByApiTokenHash(hash);
    if (!u) {
      throw new Error("Invalid refresh token");
    }
    if (u.props.status !== "active") {
      throw new Error("Account is not active");
    }

    const accessToken = this.token.signAccessToken({
      sub: u.props.id!,
      email: u.props.email,
      roleId: u.props.roleId ?? null,
    });

    return { accessToken };
  }
}
