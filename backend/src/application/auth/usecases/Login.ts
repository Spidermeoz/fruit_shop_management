import type { UserRepository } from "../../../domain/users/UserRepository";
import type { RoleRepository } from "../../../domain/roles/RoleRepository";
import type { TokenService } from "../../auth/services/TokenService";
import type { RefreshTokenService } from "../../auth/services/RefreshTokenService";
import type { PasswordService } from "../../auth/services/PasswordService";
import type { Permissions } from "../../../domain/auth/types";
import { toAuthUserView } from "../mappers/toAuthUserView";

export type LoginInput = {
  email: string;
  password: string;
  portal?: "admin" | "client";
};

export class Login {
  constructor(
    private users: UserRepository,
    private roles: RoleRepository,
    private token: TokenService,
    private refresh: RefreshTokenService,
    private password: PasswordService,
  ) {}

  async execute(input: LoginInput) {
    const email = input.email.trim().toLowerCase();
    const portal = input.portal ?? "admin";

    const rec = await this.users.findAuthByEmail(email);
    if (!rec) {
      throw new Error("Invalid credentials");
    }

    const ok = await this.password.compare(input.password, rec.passwordHash);
    if (!ok) throw new Error("Invalid credentials");

    const u = rec.user;

    if (u.props.status !== "active") {
      throw new Error("Account is not active");
    }

    // Chặn login chéo theo loại cổng đăng nhập
    if (
      portal === "admin" &&
      (u.props.roleId === null || u.props.roleId === undefined)
    ) {
      throw new Error(
        "Tài khoản khách hàng không thể đăng nhập trang quản trị",
      );
    }

    if (
      portal === "client" &&
      u.props.roleId !== null &&
      u.props.roleId !== undefined
    ) {
      throw new Error("Tài khoản này chỉ dùng cho trang quản trị");
    }

    const accessToken = this.token.signAccessToken({
      sub: u.props.id!,
      email: u.props.email,
      roleId: u.props.roleId ?? null,
    });

    const { raw: refreshToken, hash } = this.refresh.generate();
    await this.users.updateApiToken(u.props.id!, hash);

    let permissions: Permissions = {};
    if (portal === "admin" && u.props.roleId != null) {
      const role = await this.roles.findById(u.props.roleId);
      if (role?.props.permissions) {
        permissions = role.props.permissions as Permissions;
      }
    }

    return {
      accessToken,
      refreshToken,
      user: toAuthUserView(u),
      permissions,
    };
  }
}
