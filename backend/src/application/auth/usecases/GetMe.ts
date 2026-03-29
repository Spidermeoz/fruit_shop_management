import type { UserRepository } from "../../../domain/users/UserRepository";
import type { RoleRepository } from "../../../domain/roles/RoleRepository";
import type { Permissions } from "../../../domain/auth/types";
import { toAuthUserView } from "../mappers/toAuthUserView";

export class GetMe {
  constructor(
    private users: UserRepository,
    private roles: RoleRepository,
  ) {}

  async execute(userId: number, portal: "admin" | "client" = "admin") {
    const u = await this.users.findById(userId, false);
    if (!u) throw new Error("User not found");

    if (
      portal === "admin" &&
      (u.props.roleId === null || u.props.roleId === undefined)
    ) {
      throw new Error("Unauthorized admin account");
    }

    if (
      portal === "client" &&
      u.props.roleId !== null &&
      u.props.roleId !== undefined
    ) {
      throw new Error("Unauthorized client account");
    }

    let permissions: Permissions = {};
    if (portal === "admin" && u.props.roleId != null) {
      const role = await this.roles.findById(u.props.roleId);
      if (role?.props.permissions) {
        permissions = role.props.permissions as Permissions;
      }
    }

    return {
      user: toAuthUserView(u),
      permissions,
    };
  }
}
